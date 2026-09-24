import { createClient } from '@/lib/supabase/server';
import { mediaCardsByIds, type MediaCard } from '@/lib/archive/queries';

export interface PersonCard {
  id: string;
  name: string;
  itemCount: number;
  coverThumbUrl: string | null;
}

export interface RelatedPerson {
  id: string;
  name: string;
  coverThumbUrl: string | null;
}

export interface PersonRelations {
  parents: RelatedPerson[];
  children: RelatedPerson[];
  partners: RelatedPerson[];
  siblings: RelatedPerson[];
}

export interface PersonDetail {
  id: string;
  name: string;
  birthDate: string | null;
  deathDate: string | null;
  note: string | null;
  /** Tagged memories, chronological (oldest → newest): a life from young to old. */
  items: MediaCard[];
  relations: PersonRelations;
  /** True when this person has any children (enables the family-branch view). */
  hasChildren: boolean;
}

/** Sort media cards chronologically (oldest first); items without a date last. */
function chronological(items: MediaCard[]): MediaCard[] {
  return items.slice().sort((a, b) => {
    if (!a.effectiveDate) return 1;
    if (!b.effectiveDate) return -1;
    return a.effectiveDate.localeCompare(b.effectiveDate);
  });
}

/** Resolve a set of people to id + name + cover thumbnail (cover_item_id, else
 * their newest tagged item). */
async function peopleMini(
  supabase: ReturnType<typeof createClient>,
  ids: string[],
): Promise<Map<string, RelatedPerson>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const [{ data: people }, { data: links }] = await Promise.all([
    supabase.from('archive_people').select('id, display_name, cover_item_id').in('id', unique),
    supabase
      .from('archive_item_people')
      .select('person_id, archive_item_id, added_at')
      .in('person_id', unique)
      .order('added_at', { ascending: false }),
  ]);
  const firstItem = new Map<string, string>();
  for (const l of links ?? [])
    if (!firstItem.has(l.person_id)) firstItem.set(l.person_id, l.archive_item_id);
  const coverIds = (people ?? [])
    .map((p) => p.cover_item_id ?? firstItem.get(p.id) ?? null)
    .filter((v): v is string => Boolean(v));
  const covers = await mediaCardsByIds(coverIds);
  const thumb = new Map(covers.map((c) => [c.id, c.thumbUrl]));
  const out = new Map<string, RelatedPerson>();
  for (const p of people ?? []) {
    const cid = p.cover_item_id ?? firstItem.get(p.id) ?? null;
    out.set(p.id, {
      id: p.id,
      name: p.display_name,
      coverThumbUrl: cid ? (thumb.get(cid) ?? null) : null,
    });
  }
  return out;
}

/** Parents/children/partners/siblings of a person, derived from the single-stored
 * relations (both directions). Returns the classification + all involved ids. */
async function resolveRelations(
  supabase: ReturnType<typeof createClient>,
  personId: string,
): Promise<PersonRelations> {
  const { data: rels } = await supabase
    .from('archive_person_relations')
    .select('person_id, related_person_id, relation')
    .or(`person_id.eq.${personId},related_person_id.eq.${personId}`);

  const parentIds: string[] = [];
  const childIds: string[] = [];
  const partnerIds: string[] = [];
  const siblingIds: string[] = [];
  for (const r of rels ?? []) {
    const other = r.person_id === personId ? r.related_person_id : r.person_id;
    if (r.relation === 'ouder_van') {
      if (r.related_person_id === personId) parentIds.push(r.person_id);
      else childIds.push(r.related_person_id);
    } else if (r.relation === 'partner_van') partnerIds.push(other);
    else if (r.relation === 'broer_zus_van') siblingIds.push(other);
  }

  const mini = await peopleMini(supabase, [
    ...parentIds,
    ...childIds,
    ...partnerIds,
    ...siblingIds,
  ]);
  const pick = (ids: string[]) =>
    ids.map((id) => mini.get(id)).filter((p): p is RelatedPerson => Boolean(p));
  return {
    parents: pick(parentIds),
    children: pick(childIds),
    partners: pick(partnerIds),
    siblings: pick(siblingIds),
  };
}

/** All of the owner's people with a tagged-item count and a cover thumbnail. */
export async function listPeople(): Promise<PersonCard[]> {
  const supabase = createClient();
  const { data: people } = await supabase
    .from('archive_people')
    .select('id, display_name, cover_item_id, created_at')
    .order('display_name', { ascending: true });
  if (!people || people.length === 0) return [];

  const ids = people.map((p) => p.id);
  const { data: links } = await supabase
    .from('archive_item_people')
    .select('person_id, archive_item_id, added_at')
    .in('person_id', ids)
    .order('added_at', { ascending: false });

  const byPerson = new Map<string, string[]>();
  for (const link of links ?? []) {
    const list = byPerson.get(link.person_id) ?? [];
    list.push(link.archive_item_id);
    byPerson.set(link.person_id, list);
  }

  const coverIds = people
    .map((p) => p.cover_item_id ?? byPerson.get(p.id)?.[0] ?? null)
    .filter((v): v is string => Boolean(v));
  const covers = await mediaCardsByIds(coverIds);
  const thumbById = new Map(covers.map((c) => [c.id, c.thumbUrl]));

  return people.map((p) => {
    const coverId = p.cover_item_id ?? byPerson.get(p.id)?.[0] ?? null;
    return {
      id: p.id,
      name: p.display_name,
      itemCount: byPerson.get(p.id)?.length ?? 0,
      coverThumbUrl: coverId ? (thumbById.get(coverId) ?? null) : null,
    };
  });
}

/** One person: their life-line (tagged memories, chronological) plus birth/death,
 * a note, and the derived family relations. */
export async function getPerson(id: string): Promise<PersonDetail | null> {
  const supabase = createClient();
  const { data: person } = await supabase
    .from('archive_people')
    .select('id, display_name, birth_date, death_date, note')
    .eq('id', id)
    .maybeSingle();
  if (!person) return null;

  const { data: links } = await supabase
    .from('archive_item_people')
    .select('archive_item_id')
    .eq('person_id', id);
  const [items, relations] = await Promise.all([
    mediaCardsByIds((links ?? []).map((l) => l.archive_item_id)),
    resolveRelations(supabase, id),
  ]);
  return {
    id: person.id,
    name: person.display_name,
    birthDate: person.birth_date,
    deathDate: person.death_date,
    note: person.note,
    items: chronological(items),
    relations,
    hasChildren: relations.children.length > 0,
  };
}

/** A person's memories PLUS those of their children, chronological — the
 * family-branch view ("alles van mijn grootvader en zijn kinderen"). */
export async function listPersonBranchItems(id: string): Promise<MediaCard[]> {
  const supabase = createClient();
  const { data: childRels } = await supabase
    .from('archive_person_relations')
    .select('related_person_id')
    .eq('person_id', id)
    .eq('relation', 'ouder_van');
  const personIds = [id, ...(childRels ?? []).map((r) => r.related_person_id)];
  const { data: links } = await supabase
    .from('archive_item_people')
    .select('archive_item_id')
    .in('person_id', personIds);
  const itemIds = [...new Set((links ?? []).map((l) => l.archive_item_id))];
  return chronological(await mediaCardsByIds(itemIds));
}

/** People picker data for the item detail view. */
export async function getPersonMembership(
  itemId: string,
): Promise<{ people: Array<{ id: string; title: string }>; memberOf: string[] }> {
  const supabase = createClient();
  const [{ data: people }, { data: links }] = await Promise.all([
    supabase.from('archive_people').select('id, display_name').order('display_name'),
    supabase.from('archive_item_people').select('person_id').eq('archive_item_id', itemId),
  ]);
  return {
    people: (people ?? []).map((p) => ({ id: p.id, title: p.display_name })),
    memberOf: (links ?? []).map((l) => l.person_id),
  };
}
