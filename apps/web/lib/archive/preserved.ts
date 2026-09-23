import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { mediaCardsByIds, type MediaCard } from '@/lib/archive/queries';

/**
 * "Bewaard gebleven" — items that disappeared at the source but are still here.
 * The visible proof of the promise (CLAUDE.md §4): source deletion never removes
 * the archived copy, we only record it in archive_item_sources.source_deleted_at.
 */

export interface PreservedCard extends MediaCard {
  /** When the disappearance at the source was observed. */
  deletedAt: string;
  /** The human source name (connector display name), e.g. "Instagram". */
  sourceName: string;
}

export interface PreservedGroup {
  sourceName: string;
  items: PreservedCard[];
}

type DeletedRow = {
  archive_item_id: string;
  source_deleted_at: string | null;
  connector_accounts: { display_name: string | null } | null;
};

/** One entry per item that has a deleted source (most recent deletion wins),
 * newest-deletion-first, excluding hidden items. */
async function deletedItems(): Promise<
  Array<{ itemId: string; deletedAt: string; sourceName: string }>
> {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const [{ data: sources }, { data: hidden }] = await Promise.all([
    supabase
      .from('archive_item_sources')
      .select('archive_item_id, source_deleted_at, connector_accounts(display_name)')
      .not('source_deleted_at', 'is', null)
      .order('source_deleted_at', { ascending: false })
      .limit(1000),
    supabase.from('archive_item_flags').select('archive_item_id').eq('hidden', true),
  ]);

  const hiddenSet = new Set((hidden ?? []).map((h) => h.archive_item_id));
  const seen = new Set<string>();
  const out: Array<{ itemId: string; deletedAt: string; sourceName: string }> = [];
  for (const row of (sources ?? []) as unknown as DeletedRow[]) {
    const id = row.archive_item_id;
    if (!id || !row.source_deleted_at || seen.has(id) || hiddenSet.has(id)) continue;
    seen.add(id);
    out.push({
      itemId: id,
      deletedAt: row.source_deleted_at,
      sourceName: row.connector_accounts?.display_name ?? 'de bron',
    });
  }
  return out;
}

/** Count + a few recent cards for the /vandaag block. */
export async function preservedSummary(
  recentLimit = 4,
): Promise<{ count: number; recent: MediaCard[] }> {
  const items = await deletedItems();
  if (items.length === 0) return { count: 0, recent: [] };
  const topIds = items.slice(0, recentLimit).map((i) => i.itemId);
  const cards = await mediaCardsByIds(topIds);
  // Preserve deletion-recency order (mediaCardsByIds re-sorts by item date).
  const byId = new Map(cards.map((c) => [c.id, c]));
  const recent = topIds.map((id) => byId.get(id)).filter((c): c is MediaCard => Boolean(c));
  return { count: items.length, recent };
}

/** Everything preserved, grouped by source (newest deletion first per group). */
export async function listPreservedGroups(): Promise<PreservedGroup[]> {
  const items = await deletedItems();
  if (items.length === 0) return [];
  const cards = await mediaCardsByIds(items.map((i) => i.itemId));
  const byId = new Map(cards.map((c) => [c.id, c]));

  const groups = new Map<string, PreservedCard[]>();
  for (const it of items) {
    const card = byId.get(it.itemId);
    if (!card) continue;
    const enriched: PreservedCard = { ...card, deletedAt: it.deletedAt, sourceName: it.sourceName };
    (groups.get(it.sourceName) ?? groups.set(it.sourceName, []).get(it.sourceName)!).push(enriched);
  }
  return [...groups.entries()].map(([sourceName, items]) => ({ sourceName, items }));
}

/** For the detail-page line: the source an item disappeared from, or null. */
export async function itemDeletedSource(
  itemId: string,
): Promise<{ sourceName: string; deletedAt: string } | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('archive_item_sources')
    .select('source_deleted_at, connector_accounts(display_name)')
    .eq('archive_item_id', itemId)
    .not('source_deleted_at', 'is', null)
    .order('source_deleted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = data as unknown as DeletedRow | null;
  if (!row?.source_deleted_at) return null;
  return {
    sourceName: row.connector_accounts?.display_name ?? 'de bron',
    deletedAt: row.source_deleted_at,
  };
}
