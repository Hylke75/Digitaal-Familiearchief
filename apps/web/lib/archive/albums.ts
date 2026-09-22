import { createClient } from '@/lib/supabase/server';
import { mediaCardsByIds, type MediaCard } from '@/lib/archive/queries';

export { normalizeTitle } from '@/lib/archive/album-utils';

export interface AlbumCard {
  id: string;
  title: string;
  itemCount: number;
  coverThumbUrl: string | null;
}

export interface AlbumDetail {
  id: string;
  title: string;
  description: string | null;
  items: MediaCard[];
}

/** All of the owner's albums with an item count and a cover thumbnail. */
export async function listAlbums(): Promise<AlbumCard[]> {
  const supabase = createClient();
  const { data: albums } = await supabase
    .from('archive_albums')
    .select('id, title, cover_item_id, created_at')
    .order('created_at', { ascending: false });
  if (!albums || albums.length === 0) return [];

  const albumIds = albums.map((a) => a.id);
  const { data: links } = await supabase
    .from('archive_album_items')
    .select('album_id, archive_item_id, added_at')
    .in('album_id', albumIds)
    .order('added_at', { ascending: false });

  const byAlbum = new Map<string, string[]>();
  for (const link of links ?? []) {
    const list = byAlbum.get(link.album_id) ?? [];
    list.push(link.archive_item_id);
    byAlbum.set(link.album_id, list);
  }

  // Resolve cover thumbnails in one batch across all albums.
  const coverIds = albums
    .map((a) => a.cover_item_id ?? byAlbum.get(a.id)?.[0] ?? null)
    .filter((v): v is string => Boolean(v));
  const covers = await mediaCardsByIds(coverIds);
  const thumbById = new Map(covers.map((c) => [c.id, c.thumbUrl]));

  return albums.map((a) => {
    const coverId = a.cover_item_id ?? byAlbum.get(a.id)?.[0] ?? null;
    return {
      id: a.id,
      title: a.title,
      itemCount: byAlbum.get(a.id)?.length ?? 0,
      coverThumbUrl: coverId ? (thumbById.get(coverId) ?? null) : null,
    };
  });
}

/** One album with its items (newest first), or null if not the owner's. */
export async function getAlbum(id: string): Promise<AlbumDetail | null> {
  const supabase = createClient();
  const { data: album } = await supabase
    .from('archive_albums')
    .select('id, title, description')
    .eq('id', id)
    .maybeSingle();
  if (!album) return null;

  const { data: links } = await supabase
    .from('archive_album_items')
    .select('archive_item_id')
    .eq('album_id', id);
  const items = await mediaCardsByIds((links ?? []).map((l) => l.archive_item_id));
  return { id: album.id, title: album.title, description: album.description, items };
}

/** Album picker data for the item detail view: all albums + which contain the item. */
export async function getAlbumMembership(
  itemId: string,
): Promise<{ albums: Array<{ id: string; title: string }>; memberOf: string[] }> {
  const supabase = createClient();
  const [{ data: albums }, { data: links }] = await Promise.all([
    supabase.from('archive_albums').select('id, title').order('created_at', { ascending: false }),
    supabase.from('archive_album_items').select('album_id').eq('archive_item_id', itemId),
  ]);
  return {
    albums: albums ?? [],
    memberOf: (links ?? []).map((l) => l.album_id),
  };
}
