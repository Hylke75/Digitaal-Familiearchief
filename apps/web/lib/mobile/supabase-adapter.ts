import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';
import { SupabaseStorageProvider } from '@/lib/archive/supabase-storage';
import { createSupabasePersistence } from '@/lib/archive/persistence';
import type { MobileDb, MobileStorage } from './handlers';

/**
 * Build the mobile data port from an RLS-scoped (Bearer) Supabase client. All
 * reads are naturally confined to the caller by RLS; archive writes reuse the
 * vetted `archive_ingest_item` RPC via the shared persistence adapter, and
 * reconciliation uses the owner-scoped `archive_reconcile_sources` RPC.
 */
export function supabaseMobileDb(supabase: SupabaseClient<Database>, userId: string): MobileDb {
  const persistence = createSupabasePersistence(supabase);
  return {
    async findAccount(connectorKey, providerAccountIdentifier) {
      const { data } = await supabase
        .from('connector_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('connector_key', connectorKey)
        .eq('provider_account_identifier', providerAccountIdentifier)
        .maybeSingle();
      return data ? { id: data.id } : null;
    },
    async createAccount(input) {
      const { data, error } = await supabase
        .from('connector_accounts')
        .insert({
          user_id: userId,
          connector_key: input.connectorKey,
          display_name: input.displayName,
          provider_account_identifier: input.providerAccountIdentifier,
          status: 'connected',
          connected_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (error || !data) throw error ?? new Error('account insert failed');
      return { id: data.id };
    },
    async accountBelongsToUser(accountId) {
      const { data } = await supabase
        .from('connector_accounts')
        .select('id')
        .eq('id', accountId)
        .eq('user_id', userId)
        .maybeSingle();
      return Boolean(data);
    },
    async findItemByChecksum(checksum) {
      const { data } = await supabase
        .from('archive_items')
        .select('id')
        .eq('checksum_sha256', checksum)
        .maybeSingle();
      return data ? { id: data.id } : null;
    },
    async ingestItem(input) {
      return persistence.upsertItem({
        ownerId: userId,
        connectorAccountId: input.connectorAccountId,
        type: input.type,
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        checksumSha256: input.checksumSha256,
        storageProvider: input.storageProvider,
        storageKey: input.storageKey,
        sourceItemId: input.sourceItemId,
        createdAtSource: input.createdAtSource,
      });
    },
    async reconcileSources(accountId, presentSourceItemIds) {
      const { data, error } = await supabase.rpc('archive_reconcile_sources', {
        p_connector_account_id: accountId,
        p_present_source_item_ids: presentSourceItemIds,
      });
      if (error) throw error;
      return typeof data === 'number' ? data : 0;
    },
  };
}

/** Build the mobile storage port from the Supabase storage provider. */
export function supabaseMobileStorage(supabase: SupabaseClient<Database>): MobileStorage {
  const provider = new SupabaseStorageProvider(supabase);
  return {
    fetch: (key) => provider.get(key),
    createSignedUpload: (key) => provider.createSignedUpload(key),
  };
}
