// One reusable filter/sort/group engine for the demo photo archive (§30). Every
// "view" (all photos, timeline, places, albums, people, a source, a person) is a
// preset filter over the SAME canonical items — never a separate archive (§1).

import { demoPhotos, demoAlbums, demoSmartAlbums, demoPeople, regionCentroids } from './data';
import { effectiveSortTime, yearOf, monthOf, NL_MONTH_NAMES } from './dates';
import type { DemoPhoto, DemoSmartAlbum, SmartAlbumRule, LatLng } from './types';

export const NO_LOCATION = 'Zonder locatie';

/** Canonical order + labels for the photo source cards (§24). */
export const PHOTO_SOURCE_ORDER = [
  'apple_photos',
  'whatsapp',
  'instagram',
  'facebook',
  'google_photos',
  'manual_upload',
] as const;
export const PHOTO_SOURCE_LABELS: Record<string, string> = {
  apple_photos: "Apple Foto's",
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  google_photos: 'Google Photos',
  manual_upload: 'Handmatig toegevoegd',
};

export type PhotoSort = 'captured_desc' | 'captured_asc' | 'added_desc' | 'added_asc';
export const DEFAULT_SORT: PhotoSort = 'captured_desc';

export interface PhotoFilter {
  source?: string; // by primary origin (source view is by origin; provenance is per item)
  year?: number;
  place?: string; // region label, or NO_LOCATION
  person?: string;
  album?: string;
  favorite?: boolean;
  query?: string;
}

// --- filtering --------------------------------------------------------------
export function filterPhotos(photos: DemoPhoto[], f: PhotoFilter): DemoPhoto[] {
  const q = f.query?.trim().toLowerCase();
  return photos.filter((p) => {
    if (f.source && p.originSource !== f.source) return false;
    if (f.year != null && yearOf(p.capturedAt) !== f.year) return false;
    if (f.place) {
      const region = p.region ?? NO_LOCATION;
      if (region !== f.place) return false;
    }
    if (f.person && !p.people.includes(f.person)) return false;
    if (f.album && !p.albums.includes(f.album)) return false;
    if (f.favorite && !p.favorite) return false;
    if (q) {
      const hay = [p.title, p.place, p.city, p.country, ...p.tags, ...p.people]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortPhotos(photos: DemoPhoto[], sort: PhotoSort): DemoPhoto[] {
  const arr = [...photos];
  switch (sort) {
    case 'captured_asc':
      return arr.sort((a, b) => effectiveSortTime(a.capturedAt) - effectiveSortTime(b.capturedAt));
    case 'added_desc':
      return arr.sort((a, b) => b.n - a.n);
    case 'added_asc':
      return arr.sort((a, b) => a.n - b.n);
    case 'captured_desc':
    default:
      return arr.sort((a, b) => effectiveSortTime(b.capturedAt) - effectiveSortTime(a.capturedAt));
  }
}

export function queryPhotos(f: PhotoFilter = {}, sort: PhotoSort = DEFAULT_SORT): DemoPhoto[] {
  return sortPhotos(filterPhotos(demoPhotos, f), sort);
}

// --- facet options (for filter UI) -----------------------------------------
export function availableYears(photos: DemoPhoto[] = demoPhotos): number[] {
  return [...new Set(photos.map((p) => yearOf(p.capturedAt)))].sort((a, b) => b - a);
}
export function availablePlaces(photos: DemoPhoto[] = demoPhotos): string[] {
  return [...new Set(photos.map((p) => p.region ?? NO_LOCATION))].sort();
}

// --- source cards (§24) -----------------------------------------------------
export interface SourceCard {
  key: string;
  label: string;
  count: number;
}
export function photoSourceCards(): SourceCard[] {
  const counts = new Map<string, number>();
  for (const p of demoPhotos) counts.set(p.originSource, (counts.get(p.originSource) ?? 0) + 1);
  return PHOTO_SOURCE_ORDER.filter((k) => counts.has(k)).map((key) => ({
    key,
    label: PHOTO_SOURCE_LABELS[key] ?? key,
    count: counts.get(key) ?? 0,
  }));
}

// --- places (§25, §26) ------------------------------------------------------
export interface PlaceBucket {
  name: string;
  count: number;
  centroid: LatLng | null;
  coverId: string | null;
  sources: string[]; // distinct source labels represented
  from: string | null;
  to: string | null;
}
export function placeBuckets(): PlaceBucket[] {
  const byRegion = new Map<string, DemoPhoto[]>();
  for (const p of demoPhotos) {
    const key = p.region ?? NO_LOCATION;
    if (!byRegion.has(key)) byRegion.set(key, []);
    byRegion.get(key)!.push(p);
  }
  const buckets: PlaceBucket[] = [];
  for (const [name, items] of byRegion) {
    const sorted = sortPhotos(items, 'captured_asc');
    const sources = [...new Set(items.flatMap((p) => p.sources.map((s) => s.label)))];
    buckets.push({
      name,
      count: items.length,
      centroid: name === NO_LOCATION ? null : (regionCentroids[name] ?? null),
      coverId: items.find((p) => p.favorite)?.id ?? items[0]?.id ?? null,
      sources,
      from: sorted[0]?.capturedAt ?? null,
      to: sorted[sorted.length - 1]?.capturedAt ?? null,
    });
  }
  // Named places first (by count desc), "Zonder locatie" last.
  return buckets.sort((a, b) => {
    if (a.name === NO_LOCATION) return 1;
    if (b.name === NO_LOCATION) return -1;
    return b.count - a.count;
  });
}

// --- people (§28) -----------------------------------------------------------
export interface PersonCard {
  id: string;
  name: string;
  role: string;
  color: string;
  count: number;
  coverId: string | null;
}
export function peopleCards(): PersonCard[] {
  return demoPeople
    .map((person) => {
      const items = demoPhotos.filter((p) => p.people.includes(person.name));
      return {
        id: person.id,
        name: person.name,
        role: person.role,
        color: person.color,
        count: items.length,
        coverId: items.find((p) => p.favorite)?.id ?? items[0]?.id ?? null,
      };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

// --- albums (§27) -----------------------------------------------------------
export interface AlbumCard {
  id: string;
  title: string;
  type: 'user' | 'smart';
  count: number;
  coverId: string | null;
  sources: string[];
}
export function userAlbumCards(): AlbumCard[] {
  return demoAlbums
    .map((a) => {
      const items = demoPhotos.filter((p) => p.albums.includes(a.title));
      return {
        id: a.id,
        title: a.title,
        type: 'user' as const,
        count: items.length,
        coverId: items.find((p) => p.favorite)?.id ?? items[0]?.id ?? null,
        sources: [...new Set(items.flatMap((p) => p.sources.map((s) => s.label)))],
      };
    })
    .filter((a) => a.count > 0);
}

export function evalSmartAlbum(rule: SmartAlbumRule): DemoPhoto[] {
  return demoPhotos.filter((p) => {
    if (rule.favorite && !p.favorite) return false;
    if (rule.source && p.originSource !== rule.source) return false;
    if (rule.year != null && yearOf(p.capturedAt) !== rule.year) return false;
    if (rule.beforeYear != null && yearOf(p.capturedAt) >= rule.beforeYear) return false;
    if (rule.placeContains) {
      const hay = [p.place, p.city, p.country, p.region].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(rule.placeContains.toLowerCase())) return false;
    }
    return true;
  });
}
export function smartAlbumCards(): AlbumCard[] {
  return demoSmartAlbums.map((s: DemoSmartAlbum) => {
    const items = evalSmartAlbum(s.rule);
    return {
      id: s.id,
      title: s.title,
      type: 'smart' as const,
      count: items.length,
      coverId: items.find((p) => p.favorite)?.id ?? items[0]?.id ?? null,
      sources: [...new Set(items.flatMap((p) => p.sources.map((x) => x.label)))],
    };
  });
}
export function smartAlbumById(id: string): { album: DemoSmartAlbum; items: DemoPhoto[] } | null {
  const album = demoSmartAlbums.find((s) => s.id === id);
  if (!album) return null;
  return { album, items: sortPhotos(evalSmartAlbum(album.rule), DEFAULT_SORT) };
}

// --- timeline (§23) ---------------------------------------------------------
export interface TimelineDay {
  key: string;
  label: string;
  items: DemoPhoto[];
}
export interface TimelineMonth {
  key: string;
  label: string;
  days: TimelineDay[];
  count: number;
}
export interface TimelineYear {
  year: number;
  months: TimelineMonth[];
  count: number;
}
export function buildTimeline(photos: DemoPhoto[] = demoPhotos): TimelineYear[] {
  const sorted = sortPhotos(photos, 'captured_desc');
  const years = new Map<number, Map<number, Map<string, DemoPhoto[]>>>();
  for (const p of sorted) {
    const y = yearOf(p.capturedAt);
    const mo = monthOf(p.capturedAt);
    const dayKey =
      p.datePrecision === 'YEAR' || p.datePrecision === 'UNKNOWN'
        ? 'year'
        : String(p.capturedAt).slice(0, 10);
    if (!years.has(y)) years.set(y, new Map());
    const months = years.get(y)!;
    if (!months.has(mo)) months.set(mo, new Map());
    const days = months.get(mo)!;
    if (!days.has(dayKey)) days.set(dayKey, []);
    days.get(dayKey)!.push(p);
  }
  const result: TimelineYear[] = [];
  for (const [year, months] of [...years.entries()].sort((a, b) => b[0] - a[0])) {
    const monthList: TimelineMonth[] = [];
    let yearCount = 0;
    for (const [mo, days] of [...months.entries()].sort((a, b) => b[0] - a[0])) {
      const dayList: TimelineDay[] = [];
      let monthCount = 0;
      for (const [dayKey, items] of days) {
        monthCount += items.length;
        const label =
          dayKey === 'year'
            ? String(year)
            : `${Number(dayKey.slice(8, 10))} ${NL_MONTH_NAMES[mo - 1]}`;
        dayList.push({ key: dayKey, label, items });
      }
      yearCount += monthCount;
      monthList.push({
        key: `${year}-${mo}`,
        label: NL_MONTH_NAMES[mo - 1]?.toUpperCase() ?? '',
        days: dayList,
        count: monthCount,
      });
    }
    result.push({ year, months: monthList, count: yearCount });
  }
  return result;
}

// --- URL params (§31) -------------------------------------------------------
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

export function photoFilterFromParams(sp: SP): PhotoFilter {
  const year = one(sp.year);
  return {
    source: one(sp.source) || undefined,
    year: year ? Number(year) : undefined,
    place: one(sp.place) || undefined,
    person: one(sp.person) || undefined,
    album: one(sp.album) || undefined,
    favorite: one(sp.favorite) === '1' || undefined,
    query: one(sp.q) || undefined,
  };
}

export function photoSortFromParams(sp: SP): PhotoSort {
  const s = one(sp.sort);
  if (s === 'captured_asc' || s === 'added_desc' || s === 'added_asc') return s;
  return DEFAULT_SORT;
}

// --- provenance / versions (§29, §48) --------------------------------------
export function sourcesForDetail(p: DemoPhoto) {
  const active = p.sources.filter((s) => !s.sourceDeletedAt);
  const deleted = p.sources.filter((s) => s.sourceDeletedAt);
  const origin = p.sources.find((s) => s.primary) ?? p.sources[0];
  return { origin, alsoFoundIn: active.filter((s) => !s.primary), deleted, count: active.length };
}
