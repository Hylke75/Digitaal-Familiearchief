import { createClient } from '@/lib/supabase/server';
import { listOnThisDay, mediaCardsByIds, type MediaCard } from '@/lib/archive/queries';
import { listPeople } from '@/lib/archive/people';
import { anniversaryYearsAgo } from '@/lib/archive/anniversary-date';

export { anniversaryYearsAgo };

/**
 * Jubilea — "op deze dag, X jaar geleden". Dit is de emotionele kern van het
 * dashboard (DESIGN.md §17/§60): herinneringen van vandaag uit eerdere jaren,
 * verjaardagen en gedenkdagen van personen, en jubilea van gebeurtenissen.
 * Geen nieuwe data — het rijgt bestaande datums (foto's, personen, gebeurtenissen)
 * aaneen. Verborgen items tellen nooit mee (Blok 0).
 */

/** Alle beeldherinneringen van deze kalenderdag uit één eerder jaar. */
export interface PhotoAnniversary {
  kind: 'photo';
  yearsAgo: number;
  date: string;
  place: string | null;
  items: MediaCard[];
}

export interface PersonAnniversary {
  kind: 'birthday' | 'memorial';
  personId: string;
  name: string;
  /** Leeftijd (verjaardag) of jaren sinds (gedenkdag). */
  yearsAgo: number;
  date: string;
  coverThumbUrl: string | null;
}

export interface EventAnniversary {
  kind: 'event';
  eventId: string;
  title: string;
  yearsAgo: number;
  date: string;
  cover: MediaCard | null;
}

export interface TodayAnniversaries {
  photo: PhotoAnniversary[];
  people: PersonAnniversary[];
  events: EventAnniversary[];
}

/** Meest voorkomende waarde in een lijst (of null). */
function mostCommon(values: string[]): string | null {
  if (values.length === 0) return null;
  const tally = new Map<string, number>();
  let best: string | null = null;
  let bestN = 0;
  for (const v of values) {
    const n = (tally.get(v) ?? 0) + 1;
    tally.set(v, n);
    if (n > bestN) {
      bestN = n;
      best = v;
    }
  }
  return best;
}

/** Plaatsnaam per item-id (eerste gekoppelde plaats), voor de collage-kop. */
async function placeNamesByItem(
  supabase: ReturnType<typeof createClient>,
  ids: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (ids.length === 0) return out;
  const { data } = await supabase
    .from('archive_item_places')
    .select('archive_item_id, archive_places(name)')
    .in('archive_item_id', ids.slice(0, 500));
  for (const row of data ?? []) {
    const place = row.archive_places as { name: string } | { name: string }[] | null;
    const name = Array.isArray(place) ? place[0]?.name : place?.name;
    if (name && !out.has(row.archive_item_id)) out.set(row.archive_item_id, name);
  }
  return out;
}

/**
 * Alle jubilea voor vandaag (of een gegeven peildatum). De beeldjubilea komen
 * uit dezelfde on-this-day-scan als het dashboard (verborgen items al eruit),
 * gegroepeerd per jaar met een plaatsnaam-kop; personen en gebeurtenissen komen
 * uit hun eigen datums.
 */
export async function anniversariesForToday(ref: Date = new Date()): Promise<TodayAnniversaries> {
  const supabase = createClient();
  const rd = { year: ref.getFullYear(), month: ref.getMonth() + 1, day: ref.getDate() };

  // --- Beeldjubilea: groepeer on-this-day-kaarten per jaar ---
  const cards = await listOnThisDay(60);
  const byYear = new Map<number, MediaCard[]>();
  for (const c of cards) {
    const yearsAgo = anniversaryYearsAgo(c.effectiveDate, rd);
    if (yearsAgo === null) continue;
    const list = byYear.get(yearsAgo) ?? [];
    list.push(c);
    byYear.set(yearsAgo, list);
  }
  const allIds = [...byYear.values()].flat().map((c) => c.id);
  const placeByItem = await placeNamesByItem(supabase, allIds);
  const photo: PhotoAnniversary[] = [...byYear.entries()]
    .map(([yearsAgo, items]) => ({
      kind: 'photo' as const,
      yearsAgo,
      date: items[0]?.effectiveDate ?? '',
      place: mostCommon(items.map((i) => placeByItem.get(i.id)).filter((v): v is string => !!v)),
      items,
    }))
    .sort((a, b) => a.yearsAgo - b.yearsAgo);

  // --- Persoonsjubilea: verjaardagen + gedenkdagen ---
  const { data: ppl } = await supabase
    .from('archive_people')
    .select('id, display_name, birth_date, death_date')
    .or('birth_date.not.is.null,death_date.not.is.null');
  let people: PersonAnniversary[] = [];
  if (ppl && ppl.length > 0) {
    const covers = new Map((await listPeople()).map((p) => [p.id, p.coverThumbUrl]));
    for (const p of ppl) {
      const birthday = anniversaryYearsAgo(p.birth_date, rd);
      const memorial = anniversaryYearsAgo(p.death_date, rd);
      if (birthday !== null) {
        people.push({
          kind: 'birthday',
          personId: p.id,
          name: p.display_name,
          yearsAgo: birthday,
          date: p.birth_date!,
          coverThumbUrl: covers.get(p.id) ?? null,
        });
      }
      if (memorial !== null) {
        people.push({
          kind: 'memorial',
          personId: p.id,
          name: p.display_name,
          yearsAgo: memorial,
          date: p.death_date!,
          coverThumbUrl: covers.get(p.id) ?? null,
        });
      }
    }
    people = people.sort((a, b) => a.name.localeCompare(b.name));
  }

  // --- Gebeurtenisjubilea ---
  const { data: evs } = await supabase
    .from('archive_events')
    .select('id, title, happened_on, cover_item_id')
    .not('happened_on', 'is', null);
  let events: EventAnniversary[] = [];
  if (evs && evs.length > 0) {
    const matched = evs
      .map((e) => ({ e, yearsAgo: anniversaryYearsAgo(e.happened_on, rd) }))
      .filter((m): m is { e: (typeof evs)[number]; yearsAgo: number } => m.yearsAgo !== null);
    const coverCards = await mediaCardsByIds(
      matched.map((m) => m.e.cover_item_id).filter((v): v is string => !!v),
    );
    const coverById = new Map(coverCards.map((c) => [c.id, c]));
    events = matched
      .map(({ e, yearsAgo }) => ({
        kind: 'event' as const,
        eventId: e.id,
        title: e.title,
        yearsAgo,
        date: e.happened_on!,
        cover: e.cover_item_id ? (coverById.get(e.cover_item_id) ?? null) : null,
      }))
      .sort((a, b) => a.yearsAgo - b.yearsAgo);
  }

  return { photo, people, events };
}
