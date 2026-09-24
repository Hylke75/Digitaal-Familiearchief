'use server';

import { revalidatePath } from 'next/cache';
import { getConnector } from '@dla/connectors';
import { runImport } from '@dla/archive';
import { createClient } from '@/lib/supabase/server';
import { SupabaseStorageProvider } from '@/lib/archive/supabase-storage';
import { createSupabasePersistence } from '@/lib/archive/persistence';
import { makeImportedConnector } from '@/lib/archive/imported-connector';
import { isDemoSession } from '@/lib/demo-guard';
import { scannedTakenAtIso } from '@/lib/archive/scan-date';

export interface ScanState {
  done?: boolean;
  archived?: number;
  deduped?: number;
  error?: string;
}

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB — een bijgesneden JPEG blijft ruim hieronder.

/** Zorg voor een connector_accounts-rij voor de opgegeven bron (owner-scoped). */
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

/**
 * Voeg een ingescande foto toe. De browser levert al een bijgesneden, rechtgezette
 * JPEG; hier archiveren we die als gewone herinnering via hetzelfde bewezen pad als
 * import (checksum, dedup op checksum, opslag + `archive_ingest_item`-RPC, owner-
 * scoped). Verschijnt onder de bron "Scan". Een optioneel jaartal zet de foto op
 * zijn plek in de tijdlijn.
 */
export async function addScannedPhotoAction(
  _prev: ScanState,
  formData: FormData,
): Promise<ScanState> {
  const file = formData.get('photo');
  if (!(file instanceof File) || file.size === 0) return { error: 'no_file' };
  if (file.size > MAX_BYTES) return { error: 'too_large' };
  if (!file.type.startsWith('image/')) return { error: 'not_allowed' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'auth' };
  if (await isDemoSession(supabase)) return { error: 'demo' };

  const buf = new Uint8Array(await file.arrayBuffer());
  const takenAt = scannedTakenAtIso(String(formData.get('year') ?? ''), new Date().getFullYear());
  const filename = file.name || `scan-${buf.byteLength}.jpg`;

  const accountId = await ensureAccount(supabase, user.id, 'scan');
  if (!accountId) return { error: 'account' };

  const capability = getConnector('scan')!;
  let result;
  try {
    result = await runImport({
      connector: makeImportedConnector(capability, [
        {
          sourceItemId: filename,
          path: filename,
          filename,
          mimeType: file.type || 'image/jpeg',
          bytes: buf,
          createdAtSource: takenAt ?? undefined,
          metadata: takenAt ? { takenAt } : {},
        },
      ]),
      storage: new SupabaseStorageProvider(supabase),
      persistence: createSupabasePersistence(supabase),
      ownerId: user.id,
      connectorAccountId: accountId,
      concurrency: 1,
    });
  } catch {
    return { error: 'store' };
  }

  revalidatePath('/vandaag');
  revalidatePath('/fotos');
  revalidatePath('/mijn-leven');
  revalidatePath('/bronnen');
  return { done: true, archived: result.archived, deduped: result.deduped };
}
