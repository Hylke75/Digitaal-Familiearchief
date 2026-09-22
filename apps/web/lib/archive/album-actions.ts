'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { normalizeTitle } from '@/lib/archive/album-utils';

/**
 * Album mutations. All writes are owner-scoped by RLS (archive_albums CRUD-own,
 * archive_album_items authorised via parent album + item ownership), so no
 * service role is needed and cross-user writes are impossible.
 */

/** Create an album and go to it. Ignores empty titles. */
export async function createAlbumAction(formData: FormData): Promise<void> {
  const title = normalizeTitle(String(formData.get('title') ?? ''));
  if (!title) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/inloggen');

  const { data, error } = await supabase
    .from('archive_albums')
    .insert({ owner_id: user.id, title })
    .select('id')
    .single();
  if (error || !data) return;
  revalidatePath('/albums');
  redirect(`/albums/${data.id}`);
}

export async function renameAlbumAction(formData: FormData): Promise<void> {
  const albumId = String(formData.get('albumId') ?? '');
  const title = normalizeTitle(String(formData.get('title') ?? ''));
  if (!albumId || !title) return;
  const supabase = createClient();
  await supabase.from('archive_albums').update({ title }).eq('id', albumId);
  revalidatePath(`/albums/${albumId}`);
  revalidatePath('/albums');
}

export async function deleteAlbumAction(formData: FormData): Promise<void> {
  const albumId = String(formData.get('albumId') ?? '');
  if (!albumId) return;
  const supabase = createClient();
  await supabase.from('archive_albums').delete().eq('id', albumId);
  revalidatePath('/albums');
  redirect('/albums');
}

export async function removeFromAlbumAction(formData: FormData): Promise<void> {
  const albumId = String(formData.get('albumId') ?? '');
  const itemId = String(formData.get('itemId') ?? '');
  if (!albumId || !itemId) return;
  const supabase = createClient();
  await supabase
    .from('archive_album_items')
    .delete()
    .eq('album_id', albumId)
    .eq('archive_item_id', itemId);
  revalidatePath(`/albums/${albumId}`);
}

/**
 * Add/remove an item to/from an album (used by the item-detail picker). Returns
 * the resulting membership so the client can reflect it.
 */
export async function toggleItemInAlbumAction(
  albumId: string,
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
      .from('archive_album_items')
      .insert({ album_id: albumId, archive_item_id: itemId });
    if (error) return false;
  } else {
    await supabase
      .from('archive_album_items')
      .delete()
      .eq('album_id', albumId)
      .eq('archive_item_id', itemId);
  }
  revalidatePath(`/albums/${albumId}`);
  revalidatePath(`/archief/${itemId}`);
  return present;
}
