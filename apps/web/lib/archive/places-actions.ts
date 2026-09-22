'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { normalizeTitle } from '@/lib/archive/album-utils';

/** Places mutations. Manual, owner-scoped tagging (RLS). */

export async function createPlaceAction(formData: FormData): Promise<void> {
  const name = normalizeTitle(String(formData.get('name') ?? ''));
  if (!name) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/inloggen');

  const { data, error } = await supabase
    .from('archive_places')
    .insert({ owner_id: user.id, name })
    .select('id')
    .single();
  if (error || !data) return;
  revalidatePath('/plaatsen');
  redirect(`/plaatsen/${data.id}`);
}

export async function renamePlaceAction(formData: FormData): Promise<void> {
  const placeId = String(formData.get('placeId') ?? '');
  const name = normalizeTitle(String(formData.get('name') ?? ''));
  if (!placeId || !name) return;
  const supabase = createClient();
  await supabase.from('archive_places').update({ name }).eq('id', placeId);
  revalidatePath(`/plaatsen/${placeId}`);
  revalidatePath('/plaatsen');
}

export async function deletePlaceAction(formData: FormData): Promise<void> {
  const placeId = String(formData.get('placeId') ?? '');
  if (!placeId) return;
  const supabase = createClient();
  await supabase.from('archive_places').delete().eq('id', placeId);
  revalidatePath('/plaatsen');
  redirect('/plaatsen');
}

export async function removePlaceFromItemAction(formData: FormData): Promise<void> {
  const placeId = String(formData.get('placeId') ?? '');
  const itemId = String(formData.get('itemId') ?? '');
  if (!placeId || !itemId) return;
  const supabase = createClient();
  await supabase
    .from('archive_item_places')
    .delete()
    .eq('place_id', placeId)
    .eq('archive_item_id', itemId);
  revalidatePath(`/plaatsen/${placeId}`);
}

/** Tag/untag a memory with a place (item-detail picker). */
export async function toggleItemPlaceAction(
  placeId: string,
  itemId: string,
  present: boolean,
): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return !present;

  if (present) {
    const { error } = await supabase
      .from('archive_item_places')
      .insert({ place_id: placeId, archive_item_id: itemId });
    if (error) return false;
  } else {
    await supabase
      .from('archive_item_places')
      .delete()
      .eq('place_id', placeId)
      .eq('archive_item_id', itemId);
  }
  revalidatePath(`/plaatsen/${placeId}`);
  revalidatePath(`/archief/${itemId}`);
  return present;
}
