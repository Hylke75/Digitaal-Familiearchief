'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isDemoUser } from '@/lib/demo-account';
import {
  listFavourites,
  listMedia,
  type ArchiveItemType,
  type MediaPage,
} from '@/lib/archive/queries';

/** Fetch the next page for the infinite-scroll grid (called from the client). */
export async function loadMoreMediaAction(
  type: ArchiveItemType | null,
  page: number,
): Promise<MediaPage> {
  return listMedia({ type: type ?? undefined, page });
}

export type TimelineFilter = 'all' | 'photo' | 'video' | 'favourites';

/** Timeline page for a chip filter (Alles/Foto's/Video's/Favorieten, §C). */
export async function loadTimelineFilterAction(
  filter: TimelineFilter,
  page: number,
): Promise<MediaPage> {
  if (filter === 'favourites') return listFavourites({ page });
  if (filter === 'photo') return listMedia({ type: 'photo', page });
  if (filter === 'video') return listMedia({ type: 'video', page });
  return listMedia({ visualOnly: true, page });
}

/** Fetch the next page of favourites for the infinite-scroll grid. */
export async function loadMoreFavouritesAction(page: number): Promise<MediaPage> {
  return listFavourites({ page });
}

/**
 * Toggle a memory's favourite flag. RLS restricts writes to the owner's rows and
 * the insert policy re-checks that the item belongs to the caller, so this is a
 * safe upsert of per-user state that never touches the immutable item (§32).
 */
export async function toggleFavouriteAction(itemId: string, next: boolean): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  // Demo account: reflect the toggle in the UI but never persist.
  if (isDemoUser(user.id)) return next;

  const { error } = await supabase
    .from('archive_item_flags')
    .upsert(
      { owner_id: user.id, archive_item_id: itemId, favourite: next },
      { onConflict: 'owner_id,archive_item_id' },
    );
  if (error) return false;

  revalidatePath('/favorieten');
  revalidatePath(`/archief/${itemId}`);
  return next;
}
