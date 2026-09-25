import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/current-user';

/**
 * Kaartdata: waar zijn herinneringen gemaakt? Twee lagen — handmatig getagde
 * plaatsen (met een teller, linkt naar de plaatspagina) en losse foto's met GPS.
 * Verborgen items blijven van de kaart (Blok 0); de losse punten zijn gecapt om
 * de kaart licht te houden.
 */

export interface MapPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
}

export interface MapItem {
  id: string;
  lat: number;
  lng: number;
}

export interface MapData {
  places: MapPlace[];
  items: MapItem[];
}

export async function getMapData(itemCap = 500): Promise<MapData> {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return { places: [], items: [] };

  // Getagde plaatsen met coördinaten + hun itemtelling.
  const { data: places } = await supabase
    .from('archive_places')
    .select('id, name, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  const placeIds = (places ?? []).map((p) => p.id);
  const counts = new Map<string, number>();
  if (placeIds.length > 0) {
    const { data: links } = await supabase
      .from('archive_item_places')
      .select('place_id')
      .in('place_id', placeIds);
    for (const l of links ?? []) counts.set(l.place_id, (counts.get(l.place_id) ?? 0) + 1);
  }
  const mapPlaces: MapPlace[] = (places ?? [])
    .filter((p) => p.latitude !== null && p.longitude !== null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      lat: p.latitude as number,
      lng: p.longitude as number,
      count: counts.get(p.id) ?? 0,
    }));

  // Losse foto's met GPS — verborgen items eruit, gecapt.
  const { data: flags } = await supabase
    .from('archive_item_flags')
    .select('archive_item_id')
    .eq('hidden', true);
  const hidden = (flags ?? []).map((f) => f.archive_item_id);

  let q = supabase
    .from('archive_items')
    .select('id, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .limit(itemCap);
  if (hidden.length > 0) q = q.not('id', 'in', `(${hidden.join(',')})`);
  const { data: items } = await q;
  const mapItems: MapItem[] = (items ?? [])
    .filter((i) => i.latitude !== null && i.longitude !== null)
    .map((i) => ({ id: i.id, lat: i.latitude as number, lng: i.longitude as number }));

  return { places: mapPlaces, items: mapItems };
}
