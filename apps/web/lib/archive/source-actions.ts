'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { MockArchiveConnector } from '@dla/connectors';
import { runImport } from '@dla/archive';
import { createClient } from '@/lib/supabase/server';
import { auditLog } from '@/lib/security/audit';
import { SupabaseStorageProvider } from '@/lib/archive/supabase-storage';
import { createSupabasePersistence } from '@/lib/archive/persistence';

type Frequency = 'daily' | 'weekly' | 'monthly';

/** Change how often a source is checked (§42). RLS restricts to the owner's row. */
export async function setFrequencyAction(formData: FormData): Promise<void> {
  const accountId = String(formData.get('accountId') ?? '');
  const frequency = String(formData.get('frequency') ?? 'daily') as Frequency;
  if (!accountId) return;

  const supabase = createClient();
  await supabase
    .from('connector_accounts')
    .update({ archive_frequency: frequency })
    .eq('id', accountId);
  revalidatePath(`/bronnen/${accountId}`);
}

/**
 * "Nu controleren" — re-run archiving for a source. Only live connectors can be
 * re-run; the mock test source re-runs its import (idempotent, so no duplicates).
 */
export async function archiveNowAction(formData: FormData): Promise<void> {
  const accountId = String(formData.get('accountId') ?? '');
  if (!accountId) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/inloggen');

  const { data: account } = await supabase
    .from('connector_accounts')
    .select('id, connector_key')
    .eq('id', accountId)
    .maybeSingle();
  if (!account) return;

  if (account.connector_key === 'mock') {
    await runImport({
      connector: new MockArchiveConnector(),
      storage: new SupabaseStorageProvider(supabase),
      persistence: createSupabasePersistence(supabase),
      ownerId: user.id,
      connectorAccountId: account.id,
      concurrency: 8,
    });
  }

  revalidatePath(`/bronnen/${accountId}`);
  revalidatePath('/vandaag');
}

/**
 * Disconnect a source (§43): new content is no longer archived automatically,
 * but everything already preserved is retained. Deleting the connector account
 * cascades jobs and nulls source links (ON DELETE SET NULL) — archive_items are
 * NOT touched, so the archived copies remain.
 */
export async function disconnectAction(formData: FormData): Promise<void> {
  const accountId = String(formData.get('accountId') ?? '');
  if (!accountId) return;

  const supabase = createClient();
  await auditLog(supabase, 'connector_disconnected', { accountId });
  await supabase.from('connector_accounts').delete().eq('id', accountId);
  revalidatePath('/bronnen');
  redirect('/bronnen');
}
