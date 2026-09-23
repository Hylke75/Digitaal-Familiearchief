'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isDemoUser } from '@/lib/demo-account';
import { isDemoSession } from '@/lib/demo-guard';
import { normalizeTitle } from '@/lib/archive/album-utils';

/**
 * People mutations. A person is not an app user (§37); this is manual tagging
 * only — no face recognition (§59, §62). All writes are owner-scoped by RLS.
 */

/** The owner's people (id + name) for a picker. */
export async function listPersonTitlesAction(): Promise<Array<{ id: string; title: string }>> {
  const supabase = createClient();
  const { data } = await supabase
    .from('archive_people')
    .select('id, display_name')
    .order('display_name', { ascending: true });
  return (data ?? []).map((p) => ({ id: p.id, title: p.display_name }));
}

/** Tag many items with one person at once (selection mode). No-op for the demo. */
export async function bulkTagPersonAction(personId: string, ids: string[]): Promise<void> {
  if (!personId || ids.length === 0) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  await supabase.from('archive_item_people').upsert(
    ids.map((id) => ({ person_id: personId, archive_item_id: id })),
    { onConflict: 'person_id,archive_item_id', ignoreDuplicates: true },
  );
  revalidatePath(`/personen/${personId}`);
}

export async function createPersonAction(formData: FormData): Promise<void> {
  const name = normalizeTitle(String(formData.get('name') ?? ''));
  if (!name) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/inloggen');
  if (isDemoUser(user.id)) redirect('/personen');

  const { data, error } = await supabase
    .from('archive_people')
    .insert({ owner_id: user.id, display_name: name })
    .select('id')
    .single();
  if (error || !data) return;
  revalidatePath('/personen');
  redirect(`/personen/${data.id}`);
}

export async function renamePersonAction(formData: FormData): Promise<void> {
  const personId = String(formData.get('personId') ?? '');
  const name = normalizeTitle(String(formData.get('name') ?? ''));
  if (!personId || !name) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  await supabase.from('archive_people').update({ display_name: name }).eq('id', personId);
  revalidatePath(`/personen/${personId}`);
  revalidatePath('/personen');
}

export async function deletePersonAction(formData: FormData): Promise<void> {
  const personId = String(formData.get('personId') ?? '');
  if (!personId) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) redirect('/personen');
  await supabase.from('archive_people').delete().eq('id', personId);
  revalidatePath('/personen');
  redirect('/personen');
}

export async function removePersonFromItemAction(formData: FormData): Promise<void> {
  const personId = String(formData.get('personId') ?? '');
  const itemId = String(formData.get('itemId') ?? '');
  if (!personId || !itemId) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  await supabase
    .from('archive_item_people')
    .delete()
    .eq('person_id', personId)
    .eq('archive_item_id', itemId);
  revalidatePath(`/personen/${personId}`);
}

/** Tag/untag a memory with a person (item-detail picker). */
export async function toggleItemPersonAction(
  personId: string,
  itemId: string,
  present: boolean,
): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return !present;
  if (isDemoUser(user.id)) return present;

  if (present) {
    const { error } = await supabase
      .from('archive_item_people')
      .insert({ person_id: personId, archive_item_id: itemId });
    if (error) return false;
  } else {
    await supabase
      .from('archive_item_people')
      .delete()
      .eq('person_id', personId)
      .eq('archive_item_id', itemId);
  }
  revalidatePath(`/personen/${personId}`);
  revalidatePath(`/archief/${itemId}`);
  return present;
}
