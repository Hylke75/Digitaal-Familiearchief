import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { mediaCardsByIds, type MediaCard } from '@/lib/archive/queries';

/**
 * Hoofdstukken — het niveau tussen moment en jaar (functie #2). Een leven in een
 * stuk of vijftien periodes. De eigenaar maakt ze; suggesties komen uit gaten in
 * de tijdlijn en verhuizingen, maar worden nooit automatisch aangemaakt.
 */

export interface ChapterView {
  id: string;
  title: string;
  startsOn: string;
  endsOn: string | null;
  description: string | null;
  cover: MediaCard | null;
}

type ChapterRow = {
  id: string;
  title: string;
  starts_on: string;
  ends_on: string | null;
  description: string | null;
  cover_item_id: string | null;
};

/** The owner's chapters, newest period first, each with an opening image (the
 * chosen cover, or the newest photo/video within the period). */
export async function listChapters(): Promise<ChapterView[]> {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const { data } = await supabase
    .from('archive_chapters')
    .select('id, title, starts_on, ends_on, description, cover_item_id')
    .order('starts_on', { ascending: false });
  const rows = (data ?? []) as ChapterRow[];
  if (rows.length === 0) return [];

  // Resolve a cover per chapter: the explicit one, else the newest item in the
  // period (best-effort via taken_at, the usual effective date).
  const coverIdByChapter = new Map<string, string>();
  await Promise.all(
    rows.map(async (r) => {
      if (r.cover_item_id) {
        coverIdByChapter.set(r.id, r.cover_item_id);
        return;
      }
      let q = supabase
        .from('archive_items')
        .select('id')
        .in('type', ['photo', 'video'])
        .gte('taken_at', r.starts_on);
      if (r.ends_on) q = q.lte('taken_at', `${r.ends_on}T23:59:59`);
      const { data: pick } = await q.order('taken_at', { ascending: false }).limit(1).maybeSingle();
      if (pick?.id) coverIdByChapter.set(r.id, pick.id);
    }),
  );

  const cards = await mediaCardsByIds([...new Set(coverIdByChapter.values())]);
  const byId = new Map(cards.map((c) => [c.id, c]));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    startsOn: r.starts_on,
    endsOn: r.ends_on,
    description: r.description,
    cover: byId.get(coverIdByChapter.get(r.id) ?? '') ?? null,
  }));
}

export interface ChapterSuggestion {
  startsOn: string;
  endsOn: string | null;
  reason: 'gap' | 'move';
}

/**
 * Voorstellen voor periodes op basis van gaten in de tijdlijn (lange stiltes) en
 * verhuizingen (wisselingen in de meest voorkomende plaats). Nooit automatisch
 * aanmaken — dit voedt alleen een "misschien een hoofdstuk?"-hint.
 */
export async function suggestChapters(): Promise<ChapterSuggestion[]> {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const { data } = await supabase
    .from('archive_items')
    .select('taken_at, latitude, longitude')
    .in('type', ['photo', 'video'])
    .not('taken_at', 'is', null)
    .order('taken_at', { ascending: true })
    .limit(5000);
  const rows = (data ?? []) as Array<{
    taken_at: string | null;
    latitude: number | null;
    longitude: number | null;
  }>;
  if (rows.length < 5) return [];

  const GAP_DAYS = 120; // een stilte van vier maanden markeert een grens
  const suggestions: ChapterSuggestion[] = [];
  let segmentStart = rows[0]!.taken_at!;
  let prevTime = new Date(rows[0]!.taken_at!).getTime();
  // Ronde de locatie af zodat kleine verschuivingen niet als verhuizing tellen.
  const region = (r: { latitude: number | null; longitude: number | null }) =>
    r.latitude != null && r.longitude != null
      ? `${r.latitude.toFixed(0)},${r.longitude.toFixed(0)}`
      : null;
  let prevRegion = region(rows[0]!);

  for (let i = 1; i < rows.length; i++) {
    const t = new Date(rows[i]!.taken_at!).getTime();
    const gapDays = (t - prevTime) / 86_400_000;
    const reg = region(rows[i]!);
    const moved = reg != null && prevRegion != null && reg !== prevRegion;
    if (gapDays >= GAP_DAYS || moved) {
      suggestions.push({
        startsOn: segmentStart.slice(0, 10),
        endsOn: rows[i - 1]!.taken_at!.slice(0, 10),
        reason: gapDays >= GAP_DAYS ? 'gap' : 'move',
      });
      segmentStart = rows[i]!.taken_at!;
    }
    prevTime = t;
    if (reg != null) prevRegion = reg;
  }
  // Sluit het laatste segment af.
  suggestions.push({
    startsOn: segmentStart.slice(0, 10),
    endsOn: null,
    reason: 'gap',
  });
  // Nieuwste eerst, en niet te veel.
  return suggestions.reverse().slice(0, 8);
}
