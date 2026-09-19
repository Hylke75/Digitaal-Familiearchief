'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { MockArchiveConnector } from '@dla/connectors';
import { runImport } from '@dla/archive';
import { createClient } from '@/lib/supabase/server';
import { SupabaseStorageProvider } from '@/lib/archive/supabase-storage';
import { createSupabasePersistence } from '@/lib/archive/persistence';

/** Connect the mock test source: create the user's mock connector account. */
export async function connectMockAction(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/inloggen');

  const { data: existing } = await supabase
    .from('connector_accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('connector_key', 'mock')
    .maybeSingle();

  if (!existing) {
    await supabase.from('connector_accounts').insert({
      user_id: user.id,
      connector_key: 'mock',
      display_name: 'Testbron',
      status: 'connected',
      connected_at: new Date().toISOString(),
    });
  }

  redirect('/onboarding/importeren');
}

export interface ImportActionState {
  done?: boolean;
  discovered?: number;
  archived?: number;
  deduped?: number;
  failed?: number;
  error?: string;
}

/** Run the initial import for the user's mock source through the archive engine. */
export async function runMockImportAction(
  _prev: ImportActionState,
  _formData: FormData,
): Promise<ImportActionState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'auth' };

  const { data: account } = await supabase
    .from('connector_accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('connector_key', 'mock')
    .maybeSingle();
  if (!account) return { error: 'no_account' };

  const result = await runImport({
    connector: new MockArchiveConnector(),
    storage: new SupabaseStorageProvider(supabase),
    persistence: createSupabasePersistence(supabase),
    ownerId: user.id,
    connectorAccountId: account.id,
    concurrency: 8,
  });

  revalidatePath('/vandaag');
  revalidatePath('/fotos');
  revalidatePath('/bronnen');

  return {
    done: true,
    discovered: result.discovered,
    archived: result.archived,
    deduped: result.deduped,
    failed: result.failed,
  };
}
