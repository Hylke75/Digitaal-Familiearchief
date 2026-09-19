import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';
import type { ArchivePersistencePort } from '@dla/archive';

/**
 * Persistence adapter for the archive engine. All writes go through the vetted
 * `archive_ingest_item` RPC (SECURITY DEFINER, owner-scoped, dedups on
 * checksum), so the app needs no service-role key and users cannot write
 * arbitrary archive rows (CLAUDE.md §44 intent).
 */
export function createSupabasePersistence(
  supabase: SupabaseClient<Database>,
): ArchivePersistencePort {
  return {
    async upsertItem(input) {
      const { data, error } = await supabase.rpc('archive_ingest_item', {
        p_connector_account_id: input.connectorAccountId,
        p_type: input.type,
        p_original_filename: input.originalFilename,
        p_mime_type: input.mimeType,
        p_file_size: input.fileSize,
        p_checksum_sha256: input.checksumSha256,
        p_storage_provider: input.storageProvider,
        p_storage_key: input.storageKey,
        p_source_item_id: input.sourceItemId,
        p_created_at_source: input.createdAtSource,
        p_modified_at_source: input.modifiedAtSource,
        p_source_url: input.sourceUrlIfSafe,
      });
      if (error) throw error;
      const deduped =
        typeof data === 'object' && data !== null && 'deduped' in data
          ? Boolean((data as { deduped?: unknown }).deduped)
          : false;
      return { deduped };
    },
  };
}
