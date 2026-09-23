'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isDemoUser } from '@/lib/demo-account';
import { isDemoSession } from '@/lib/demo-guard';
import { normalizeTitle } from '@/lib/archive/album-utils';

/** The owner's albums (id + title) for a picker. */
export async function listAlbumTitlesAction(): Promise<Array<{ id: string; title: string }>> {
  const supabase = createClient();
  const { data } = await supabase
    .from('archive_albums')
    .select('id, title')
    .order('created_at', { ascending: false });
  return data ?? [];
}

/** Add many items to an album at once (selection mode). No-op for the demo. */
export async function bulkAddToAlbumAction(albumId: string, ids: string[]): Promise<void> {
  if (!albumId || ids.length === 0) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  await supabase.from('archive_album_items').upsert(
    ids.map((id) => ({ album_id: albumId, archive_item_id: id })),
    { onConflict: 'album_id,archive_item_id', ignoreDuplicates: true },
  );
  revalidatePath(`/albums/${albumId}`);
}

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
  if (isDemoUser(user.id)) redirect('/albums');

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
  if (await isDemoSession(supabase)) return;
  await supabase.from('archive_albums').update({ title }).eq('id', albumId);
  revalidatePath(`/albums/${albumId}`);
  revalidatePath('/albums');
}

export async function deleteAlbumAction(formData: FormData): Promise<void> {
  const albumId = String(formData.get('albumId') ?? '');
  if (!albumId) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) redirect('/albums');
  await supabase.from('archive_albums').delete().eq('id', albumId);
  revalidatePath('/albums');
  redirect('/albums');
}

export async function removeFromAlbumAction(formData: FormData): Promise<void> {
  const albumId = String(formData.get('albumId') ?? '');
  const itemId = String(formData.get('itemId') ?? '');
  if (!albumId || !itemId) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
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
  if (isDemoUser(user.id)) return present;

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
