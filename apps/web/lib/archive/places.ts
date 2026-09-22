import { createClient } from '@/lib/supabase/server';
import { mediaCardsByIds, type MediaCard } from '@/lib/archive/queries';

export interface PlaceCard {
  id: string;
  name: string;
  itemCount: number;
  coverThumbUrl: string | null;
}

export interface PlaceDetail {
  id: string;
  name: string;
  items: MediaCard[];
}

/** All of the owner's places with a tagged-item count and a cover thumbnail. */
export async function listPlaces(): Promise<PlaceCard[]> {
  const supabase = createClient();
  const { data: places } = await supabase
    .from('archive_places')
    .select('id, name, created_at')
    .order('name', { ascending: true });
  if (!places || places.length === 0) return [];

  const ids = places.map((p) => p.id);
  const { data: links } = await supabase
    .from('archive_item_places')
    .select('place_id, archive_item_id, added_at')
    .in('place_id', ids)
    .order('added_at', { ascending: false });

  const byPlace = new Map<string, string[]>();
  for (const link of links ?? []) {
    const list = byPlace.get(link.place_id) ?? [];
    list.push(link.archive_item_id);
    byPlace.set(link.place_id, list);
  }

  const coverIds = places
    .map((p) => byPlace.get(p.id)?.[0] ?? null)
    .filter((v): v is string => Boolean(v));
  const covers = await mediaCardsByIds(coverIds);
  const thumbById = new Map(covers.map((c) => [c.id, c.thumbUrl]));

  return places.map((p) => {
    const coverId = byPlace.get(p.id)?.[0] ?? null;
    return {
      id: p.id,
      name: p.name,
      itemCount: byPlace.get(p.id)?.length ?? 0,
      coverThumbUrl: coverId ? (thumbById.get(coverId) ?? null) : null,
    };
  });
}

/** One place with the memories tagged there (newest first). */
export async function getPlace(id: string): Promise<PlaceDetail | null> {
  const supabase = createClient();
  const { data: place } = await supabase
    .from('archive_places')
    .select('id, name')
    .eq('id', id)
    .maybeSingle();
  if (!place) return null;

  const { data: links } = await supabase
    .from('archive_item_places')
    .select('archive_item_id')
    .eq('place_id', id);
  const items = await mediaCardsByIds((links ?? []).map((l) => l.archive_item_id));
  return { id: place.id, name: place.name, items };
}

/** Place picker data for the item detail view. */
export async function getPlaceMembership(
  itemId: string,
): Promise<{ places: Array<{ id: string; title: string }>; memberOf: string[] }> {
  const supabase = createClient();
  const [{ data: places }, { data: links }] = await Promise.all([
    supabase.from('archive_places').select('id, name').order('name'),
    supabase.from('archive_item_places').select('place_id').eq('archive_item_id', itemId),
  ]);
  return {
    places: (places ?? []).map((p) => ({ id: p.id, title: p.name })),
    memberOf: (links ?? []).map((l) => l.place_id),
  };
}
