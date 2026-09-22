import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Enums } from '@dla/database';
import { createClient } from '@/lib/supabase/server';
import { escapeLike } from '@/lib/archive/search-utils';

export type ArchiveItemType = Enums<'archive_item_type'>;

const BUCKET = 'archief';
export const MEDIA_PAGE_SIZE = 60;

// Types the browser can render as a real thumbnail via a transform; everything
// else (HEIC, video, documents) falls back to a file card until slice 4 adds
// server-generated derivatives.
const RENDERABLE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

export interface MediaCard {
  id: string;
  filename: string;
  type: ArchiveItemType;
  mimeType: string;
  fileSize: number;
  /** taken → source-created → archived, for timeline ordering & display. */
  effectiveDate: string | null;
  thumbUrl: string | null;
  favourite: boolean;
  width: number | null;
  height: number | null;
  durationMs: number | null;
}

export interface MediaPage {
  items: MediaCard[];
  hasMore: boolean;
  nextPage: number;
}

const EMPTY: MediaPage = { items: [], hasMore: false, nextPage: 0 };

async function signThumb(
  supabase: SupabaseClient<Database>,
  storageKey: string,
): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(storageKey, 3600, {
    transform: { width: 600, height: 600, resize: 'cover', quality: 60 },
  });
  return data?.signedUrl ?? null;
}

/** Ids the owner has hidden — excluded from every browsing surface. */
async function hiddenIds(supabase: SupabaseClient<Database>): Promise<string[]> {
  const { data } = await supabase
    .from('archive_item_flags')
    .select('archive_item_id')
    .eq('hidden', true);
  return (data ?? []).map((r) => r.archive_item_id);
}

type ItemRow = {
  id: string;
  original_filename: string;
  type: ArchiveItemType;
  mime_type: string;
  file_size: number;
  taken_at: string | null;
  created_at_source: string | null;
  archived_at: string | null;
  storage_key: string;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
};

async function toCards(supabase: SupabaseClient<Database>, rows: ItemRow[]): Promise<MediaCard[]> {
  const ids = rows.map((r) => r.id);
  const favourites = new Set<string>();
  const thumbKeys = new Map<string, string>();
  if (ids.length > 0) {
    const [{ data: flags }, { data: derivs }] = await Promise.all([
      supabase
        .from('archive_item_flags')
        .select('archive_item_id')
        .eq('favourite', true)
        .in('archive_item_id', ids),
      supabase
        .from('archive_derivatives')
        .select('archive_item_id, storage_key, kind')
        .in('kind', ['thumb', 'poster'])
        .in('archive_item_id', ids),
    ]);
    (flags ?? []).forEach((r) => favourites.add(r.archive_item_id));
    // A photo has a 'thumb', a video a 'poster'; either becomes the tile image.
    (derivs ?? []).forEach((d) => thumbKeys.set(d.archive_item_id, d.storage_key));
  }
  return Promise.all(
    rows.map(async (r) => {
      // Prefer a persisted thumbnail (the only way HEIC/other non-transformable
      // formats get a preview); otherwise transform a renderable original.
      const derivKey = thumbKeys.get(r.id);
      let thumbUrl: string | null = null;
      if (derivKey) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(derivKey, 3600);
        thumbUrl = data?.signedUrl ?? null;
      } else if (RENDERABLE.has(r.mime_type)) {
        thumbUrl = await signThumb(supabase, r.storage_key);
      }
      return {
        id: r.id,
        filename: r.original_filename,
        type: r.type,
        mimeType: r.mime_type,
        fileSize: r.file_size,
        effectiveDate: r.taken_at ?? r.created_at_source ?? r.archived_at,
        thumbUrl,
        favourite: favourites.has(r.id),
        width: r.width,
        height: r.height,
        durationMs: r.duration_ms,
      };
    }),
  );
}

const SELECT =
  'id, original_filename, type, mime_type, file_size, taken_at, created_at_source, archived_at, storage_key, width, height, duration_ms';

// Newest first by effective date. taken_at is preferred but nearly always null
// today (connectors don't yet extract EXIF), so ordering collapses to
// created_at_source — correct for the current data (docs/ARCHIVE_EXPERIENCE_AUDIT.md).
function orderNewest<T>(q: T): T {
  const query = q as unknown as {
    order: (c: string, o: { ascending: boolean; nullsFirst?: boolean }) => typeof query;
  };
  return query
    .order('taken_at', { ascending: false, nullsFirst: false })
    .order('created_at_source', { ascending: false, nullsFirst: false })
    .order('archived_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false }) as unknown as T;
}

/**
 * A page of media, optionally filtered by type and/or a filename query, newest
 * first, hidden excluded. The text query is a case-insensitive filename match —
 * a deliberately simple MVP search (docs/ARCHIVE_EXPERIENCE_AUDIT.md §7).
 */
export async function listMedia(
  opts: {
    type?: ArchiveItemType;
    q?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<MediaPage> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const pageSize = opts.pageSize ?? MEDIA_PAGE_SIZE;
  const page = Math.max(0, opts.page ?? 0);
  const from = page * pageSize;
  const hidden = await hiddenIds(supabase);
  const q = opts.q?.trim();

  let query = supabase.from('archive_items').select(SELECT);
  if (opts.type) query = query.eq('type', opts.type);
  if (q) query = query.ilike('original_filename', `%${escapeLike(q)}%`);
  if (hidden.length > 0) query = query.not('id', 'in', `(${hidden.join(',')})`);
  query = orderNewest(query).range(from, from + pageSize); // one extra row → hasMore

  const { data } = await query;
  const rows = (data ?? []) as ItemRow[];
  const hasMore = rows.length > pageSize;
  const pageRows = hasMore ? rows.slice(0, pageSize) : rows;
  return { items: await toCards(supabase, pageRows), hasMore, nextPage: page + 1 };
}

/** A page of the owner's favourites, newest first. */
export async function listFavourites(
  opts: { page?: number; pageSize?: number } = {},
): Promise<MediaPage> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const { data: flags } = await supabase
    .from('archive_item_flags')
    .select('archive_item_id')
    .eq('favourite', true);
  const ids = (flags ?? []).map((r) => r.archive_item_id);
  if (ids.length === 0) return EMPTY;

  const pageSize = opts.pageSize ?? MEDIA_PAGE_SIZE;
  const page = Math.max(0, opts.page ?? 0);
  const from = page * pageSize;

  const { data } = await orderNewest(
    supabase.from('archive_items').select(SELECT).in('id', ids),
  ).range(from, from + pageSize);
  const rows = (data ?? []) as ItemRow[];
  const hasMore = rows.length > pageSize;
  const pageRows = hasMore ? rows.slice(0, pageSize) : rows;
  return { items: await toCards(supabase, pageRows), hasMore, nextPage: page + 1 };
}

/** Build media cards for a specific set of ids (newest first). Used by albums/
 * people/places feeds. Capped to keep a single query bounded. */
export async function mediaCardsByIds(ids: string[]): Promise<MediaCard[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await orderNewest(
    supabase.from('archive_items').select(SELECT).in('id', ids.slice(0, 500)),
  );
  return toCards(supabase, (data ?? []) as ItemRow[]);
}

export interface ItemDetail extends MediaCard {
  camera: string | null;
  archivedAt: string | null;
  /** A larger signed preview for images; null for non-renderable types. */
  previewUrl: string | null;
  /** Signed URL to stream the original (used for video/audio playback). */
  originalUrl: string | null;
}

/** Full detail for one item (RLS restricts to the owner). */
export async function getItemDetail(id: string): Promise<ItemDetail | null> {
  const supabase = createClient();
  const { data: r } = await supabase
    .from('archive_items')
    .select(`${SELECT}, camera`)
    .eq('id', id)
    .maybeSingle();
  if (!r) return null;
  const row = r as ItemRow & { camera: string | null };

  const [{ data: fav }, { data: deriv }, transformPreview, originalUrl] = await Promise.all([
    supabase.from('archive_item_flags').select('favourite').eq('archive_item_id', id).maybeSingle(),
    supabase
      .from('archive_derivatives')
      .select('storage_key')
      .eq('archive_item_id', id)
      .eq('kind', 'thumb')
      .maybeSingle(),
    RENDERABLE.has(row.mime_type)
      ? supabase.storage
          .from(BUCKET)
          .createSignedUrl(row.storage_key, 3600, {
            transform: { width: 1600, height: 1600, resize: 'contain', quality: 80 },
          })
          .then((res) => res.data?.signedUrl ?? null)
      : Promise.resolve(null),
    row.type === 'video' || row.type === 'audio'
      ? supabase.storage
          .from(BUCKET)
          .createSignedUrl(row.storage_key, 3600)
          .then((res) => res.data?.signedUrl ?? null)
      : Promise.resolve(null),
  ]);

  // Non-transformable images (HEIC) fall back to the persisted thumbnail so the
  // detail view still shows something rather than "no preview".
  let previewUrl = transformPreview;
  if (!previewUrl && row.type === 'photo' && deriv?.storage_key) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(deriv.storage_key, 3600);
    previewUrl = data?.signedUrl ?? null;
  }

  return {
    id: row.id,
    filename: row.original_filename,
    type: row.type,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    effectiveDate: row.taken_at ?? row.created_at_source ?? row.archived_at,
    thumbUrl: null,
    favourite: Boolean(fav?.favourite),
    width: row.width,
    height: row.height,
    durationMs: row.duration_ms,
    camera: row.camera,
    archivedAt: row.archived_at,
    previewUrl,
    originalUrl,
  };
}
