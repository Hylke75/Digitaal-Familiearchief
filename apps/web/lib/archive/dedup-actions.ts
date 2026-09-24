'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { isDemoSession } from '@/lib/demo-guard';

/**
 * Voeg duplicaten samen met het behouden item. Omkeerbaar: het duplicaat wordt
 * verborgen en als "wacht op opruimen" vastgelegd — pas na 30 dagen ruimt de
 * achtergrondtaak het echt op (en zet dan eerst de bronkoppelingen over). Alles
 * owner-scoped via RLS; no-op voor de demo.
 */
export async function mergeDuplicatesAction(
  keeperId: string,
  duplicateIds: string[],
): Promise<void> {
  const clean = duplicateIds.filter((id) => id && id !== keeperId);
  if (!keeperId || clean.length === 0) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  const user = await getCurrentUser();
  if (!user) return;

  // Alleen `hidden` bijwerken (upsert laat favourite ongemoeid).
  await supabase.from('archive_item_flags').upsert(
    clean.map((id) => ({ owner_id: user.id, archive_item_id: id, hidden: true })),
    { onConflict: 'owner_id,archive_item_id' },
  );
  await supabase.from('archive_dedup_pending').upsert(
    clean.map((id) => ({ owner_id: user.id, archive_item_id: id, merged_into_id: keeperId })),
    { onConflict: 'archive_item_id', ignoreDuplicates: true },
  );
  revalidatePath('/opruimen');
  revalidatePath('/mijn-leven');
}

/** Draai een samenvoeging terug (binnen 30 dagen): rij weg + weer zichtbaar. De
 * achtergrondtaak vindt dan niets meer om op te ruimen. */
export async function undoDedupAction(formData: FormData): Promise<void> {
  const itemId = String(formData.get('itemId') ?? '');
  if (!itemId) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  const user = await getCurrentUser();
  if (!user) return;

  await supabase.from('archive_dedup_pending').delete().eq('archive_item_id', itemId);
  await supabase
    .from('archive_item_flags')
    .upsert([{ owner_id: user.id, archive_item_id: itemId, hidden: false }], {
      onConflict: 'owner_id,archive_item_id',
    });
  revalidatePath('/opruimen');
  revalidatePath('/mijn-leven');
}
