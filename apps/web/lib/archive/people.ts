import { createClient } from '@/lib/supabase/server';
import { mediaCardsByIds, type MediaCard } from '@/lib/archive/queries';

export interface PersonCard {
  id: string;
  name: string;
  itemCount: number;
  coverThumbUrl: string | null;
}

export interface PersonDetail {
  id: string;
  name: string;
  items: MediaCard[];
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

/** One person with the memories they're tagged in (newest first). */
export async function getPerson(id: string): Promise<PersonDetail | null> {
  const supabase = createClient();
  const { data: person } = await supabase
    .from('archive_people')
    .select('id, display_name')
    .eq('id', id)
    .maybeSingle();
  if (!person) return null;

  const { data: links } = await supabase
    .from('archive_item_people')
    .select('archive_item_id')
    .eq('person_id', id);
  const items = await mediaCardsByIds((links ?? []).map((l) => l.archive_item_id));
  return { id: person.id, name: person.display_name, items };
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
