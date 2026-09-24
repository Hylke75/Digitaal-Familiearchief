import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';

type Admin = SupabaseClient<Database>;
const BUCKET = 'archief';

/**
 * Ruim samengevoegde duplicaten op waarvan de 30-dagen-termijn is verstreken.
 * Draait onder de service role in de cron-worker. Per duplicaat: zet de
 * bronkoppelingen over naar het behouden item (§22), verwijder de rij (cascade
 * ruimt flags/derivatives/pending mee), en verwijder het opslagobject alleen
 * als geen enkel ander item dezelfde binary gebruikt (identieke items delen één
 * storage_key — die mag nooit weg). Best-effort en begrensd. Retourneert het
 * aantal opgeruimde items.
 */
export async function purgeDedupBatch(admin: Admin, limit = 20): Promise<number> {
  const { data: due } = await admin
    .from('archive_dedup_pending')
    .select('archive_item_id, merged_into_id')
    .lt('purge_after', new Date().toISOString())
    .limit(limit);
  if (!due || due.length === 0) return 0;

  let purged = 0;
  for (const row of due) {
    try {
      const { data: item } = await admin
        .from('archive_items')
        .select('storage_key')
        .eq('id', row.archive_item_id)
        .maybeSingle();

      // Preserve source relationships by moving them to the kept item.
      if (row.merged_into_id) {
        await admin
          .from('archive_item_sources')
          .update({ archive_item_id: row.merged_into_id })
          .eq('archive_item_id', row.archive_item_id)
          .then(
            () => {},
            () => {}, // a unique collision with the keeper's sources → left to cascade
          );
      }

      await admin.from('archive_items').delete().eq('id', row.archive_item_id);

      // Reclaim the blob only when nothing else references it.
      if (item?.storage_key) {
        const { count } = await admin
          .from('archive_items')
          .select('id', { count: 'exact', head: true })
          .eq('storage_key', item.storage_key);
        if ((count ?? 0) === 0) await admin.storage.from(BUCKET).remove([item.storage_key]);
      }
      purged += 1;
    } catch {
      // A single stuck row never blocks the batch; a later tick retries.
    }
  }
  return purged;
}
