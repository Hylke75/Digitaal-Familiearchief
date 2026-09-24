import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { mediaCardsByIds, type MediaCard } from '@/lib/archive/queries';

/**
 * Ontdubbelen — het archief kleiner en beter maken (functie #9). Drie niveaus in
 * volgorde van zekerheid: identiek (zelfde checksum), vrijwel identiek (zelfde
 * afmetingen + opnamemoment binnen enkele seconden) en series (>3 binnen een
 * halve minuut). Elk item hoort bij hoogstens één niveau — het meest zekere.
 * Verborgen items en al-samengevoegde duplicaten (archive_dedup_pending) tellen
 * niet mee. (Kluis-items worden uitgesloten zodra de kluis bestaat.)
 */

const NEAR_MS = 3_000; // vrijwel identiek: opnamemoment binnen 3s
const SERIES_MS = 30_000; // series: binnen 30s
const SERIES_MIN = 4; // meer dan drie opnames

export interface DupGroup {
  /** Het te behouden item (oudste archived_at). */
  keeperId: string;
  items: MediaCard[];
}

export interface DedupResult {
  identical: DupGroup[];
  nearIdentical: DupGroup[];
  series: DupGroup[];
  /** Aantal overtollige kopieën (identiek + vrijwel identiek), voor de teller. */
  duplicateCount: number;
}

type Row = {
  id: string;
  checksum_sha256: string;
  taken_at: string | null;
  created_at_source: string | null;
  archived_at: string | null;
  width: number | null;
  height: number | null;
};

const effMs = (r: Row): number | null => {
  const s = r.taken_at ?? r.created_at_source ?? r.archived_at;
  return s ? new Date(s).getTime() : null;
};
const archMs = (r: Row): number => (r.archived_at ? new Date(r.archived_at).getTime() : 0);

export async function detectDuplicates(): Promise<DedupResult> {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return { identical: [], nearIdentical: [], series: [], duplicateCount: 0 };

  const [{ data: items }, { data: hidden }, { data: pending }] = await Promise.all([
    supabase
      .from('archive_items')
      .select('id, checksum_sha256, taken_at, created_at_source, archived_at, width, height')
      .in('type', ['photo', 'video'])
      .limit(5000),
    supabase.from('archive_item_flags').select('archive_item_id').eq('hidden', true),
    supabase.from('archive_dedup_pending').select('archive_item_id'),
  ]);

  const skip = new Set<string>([
    ...(hidden ?? []).map((h) => h.archive_item_id),
    ...(pending ?? []).map((p) => p.archive_item_id),
  ]);
  const rows = ((items ?? []) as Row[]).filter((r) => !skip.has(r.id));

  const claimed = new Set<string>();
  const keeperOf = (group: Row[]): string =>
    group.reduce((oldest, r) => (archMs(r) < archMs(oldest) ? r : oldest), group[0]!).id;

  // Level 1 — identical checksum.
  const byChecksum = new Map<string, Row[]>();
  for (const r of rows) {
    (
      byChecksum.get(r.checksum_sha256) ??
      byChecksum.set(r.checksum_sha256, []).get(r.checksum_sha256)!
    ).push(r);
  }
  const identicalRaw: Array<{ keeperId: string; ids: string[] }> = [];
  for (const group of byChecksum.values()) {
    if (group.length < 2) continue;
    group.forEach((r) => claimed.add(r.id));
    identicalRaw.push({ keeperId: keeperOf(group), ids: group.map((r) => r.id) });
  }

  // Level 2 — same dimensions, capture moment within a few seconds.
  const byDims = new Map<string, Row[]>();
  for (const r of rows) {
    if (claimed.has(r.id) || r.width == null || r.height == null || effMs(r) == null) continue;
    const k = `${r.width}x${r.height}`;
    (byDims.get(k) ?? byDims.set(k, []).get(k)!).push(r);
  }
  const nearRaw: Array<{ keeperId: string; ids: string[] }> = [];
  for (const bucket of byDims.values()) {
    const sorted = bucket.slice().sort((a, b) => effMs(a)! - effMs(b)!);
    let run: Row[] = [];
    const flush = () => {
      if (run.length >= 2) {
        run.forEach((r) => claimed.add(r.id));
        nearRaw.push({ keeperId: keeperOf(run), ids: run.map((r) => r.id) });
      }
      run = [];
    };
    for (const r of sorted) {
      if (run.length === 0 || effMs(r)! - effMs(run[run.length - 1]!)! <= NEAR_MS) run.push(r);
      else {
        flush();
        run.push(r);
      }
    }
    flush();
  }

  // Level 3 — a burst: more than three captures within 30 seconds.
  const timed = rows
    .filter((r) => !claimed.has(r.id) && effMs(r) != null)
    .sort((a, b) => effMs(a)! - effMs(b)!);
  const seriesRaw: Array<{ keeperId: string; ids: string[] }> = [];
  let run: Row[] = [];
  const flushSeries = () => {
    if (run.length >= SERIES_MIN) {
      run.forEach((r) => claimed.add(r.id));
      seriesRaw.push({ keeperId: keeperOf(run), ids: run.map((r) => r.id) });
    }
    run = [];
  };
  for (const r of timed) {
    if (run.length === 0 || effMs(r)! - effMs(run[0]!)! <= SERIES_MS) run.push(r);
    else {
      flushSeries();
      run.push(r);
    }
  }
  flushSeries();

  // Hydrate cards for everything involved (bounded), then assemble groups.
  const allIds = [...identicalRaw, ...nearRaw, ...seriesRaw].flatMap((g) => g.ids);
  const cards = await mediaCardsByIds([...new Set(allIds)]);
  const byId = new Map(cards.map((c) => [c.id, c]));
  const toGroup = (g: { keeperId: string; ids: string[] }): DupGroup => ({
    keeperId: g.keeperId,
    items: g.ids.map((id) => byId.get(id)).filter((c): c is MediaCard => Boolean(c)),
  });

  const identical = identicalRaw.map(toGroup).filter((g) => g.items.length >= 2);
  const nearIdentical = nearRaw.map(toGroup).filter((g) => g.items.length >= 2);
  const series = seriesRaw.map(toGroup).filter((g) => g.items.length >= SERIES_MIN);
  const duplicateCount = [...identical, ...nearIdentical].reduce(
    (n, g) => n + g.items.length - 1,
    0,
  );

  return { identical, nearIdentical, series, duplicateCount };
}

export interface PendingMerge {
  item: MediaCard;
  createdAt: string;
}

/** Recently merged duplicates that can still be undone (newest first). */
export async function listPendingMerges(): Promise<PendingMerge[]> {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await supabase
    .from('archive_dedup_pending')
    .select('archive_item_id, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  const rows = data ?? [];
  if (rows.length === 0) return [];
  const cards = await mediaCardsByIds(rows.map((r) => r.archive_item_id));
  const byId = new Map(cards.map((c) => [c.id, c]));
  return rows
    .map((r) => {
      const item = byId.get(r.archive_item_id);
      return item ? { item, createdAt: r.created_at } : null;
    })
    .filter((p): p is PendingMerge => Boolean(p));
}
