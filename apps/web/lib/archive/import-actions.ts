'use server';

import { revalidatePath } from 'next/cache';
import {
  detectImporter,
  listZipEntries,
  mimeFromName,
  readZipSafely,
  type ImportedItem,
} from '@dla/import';
import { getConnector } from '@dla/connectors';
import { runImport } from '@dla/archive';
import { createClient } from '@/lib/supabase/server';
import { SupabaseStorageProvider } from '@/lib/archive/supabase-storage';
import { createSupabasePersistence } from '@/lib/archive/persistence';
import { makeImportedConnector } from '@/lib/archive/imported-connector';

/** Map an importer key to the connector_accounts key it archives under. */
const IMPORTER_TO_CONNECTOR: Record<string, string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  snapchat: 'snapchat',
  x: 'x',
  whatsapp: 'whatsapp',
  google_takeout: 'google_photos',
  generic: 'phone',
};

export interface ImportState {
  done?: boolean;
  provider?: string;
  discovered?: number;
  archived?: number;
  deduped?: number;
  failed?: number;
  error?: string;
}

async function ensureAccount(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  connectorKey: string,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('connector_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('connector_key', connectorKey)
    .maybeSingle();
  if (existing) return existing.id;

  const displayName = getConnector(connectorKey)?.displayName ?? connectorKey;
  const { data: created, error } = await supabase
    .from('connector_accounts')
    .insert({
      user_id: userId,
      connector_key: connectorKey,
      display_name: displayName,
      status: 'connected',
      connected_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) return null;
  return created.id;
}

export async function importArchiveAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'no_file' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'auth' };

  const buf = new Uint8Array(await file.arrayBuffer());
  const isZip = file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip';

  let items: ImportedItem[];
  let importerKey = 'generic';
  let providerLabel = 'Archiefbestand';

  try {
    if (isZip) {
      const entries = await listZipEntries(buf);
      const { importer } = detectImporter(entries);
      const files = await readZipSafely(buf);
      const parsed = importer.parse(files);
      items = parsed.items;
      importerKey = importer.key;
      providerLabel = importer.displayName;
    } else {
      // A single uploaded media/document file.
      items = [
        {
          sourceItemId: file.name,
          path: file.name,
          filename: file.name,
          mimeType: file.type || mimeFromName(file.name),
          bytes: buf,
        },
      ];
      importerKey = 'generic';
      providerLabel = 'Telefoon';
    }
  } catch {
    return { error: 'parse' };
  }

  if (items.length === 0) {
    return {
      done: true,
      provider: providerLabel,
      discovered: 0,
      archived: 0,
      deduped: 0,
      failed: 0,
    };
  }

  const connectorKey = IMPORTER_TO_CONNECTOR[importerKey] ?? 'phone';
  const accountId = await ensureAccount(supabase, user.id, connectorKey);
  if (!accountId) return { error: 'account' };

  const capability = getConnector(connectorKey) ?? getConnector('phone')!;
  const result = await runImport({
    connector: makeImportedConnector(capability, items),
    storage: new SupabaseStorageProvider(supabase),
    persistence: createSupabasePersistence(supabase),
    ownerId: user.id,
    connectorAccountId: accountId,
    concurrency: 6,
  });

  revalidatePath('/vandaag');
  revalidatePath('/fotos');
  revalidatePath('/bronnen');

  return {
    done: true,
    provider: providerLabel,
    discovered: result.discovered,
    archived: result.archived,
    deduped: result.deduped,
    failed: result.failed,
  };
}
