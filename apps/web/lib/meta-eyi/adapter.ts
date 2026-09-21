import { archiveTypeFromMime } from '@dla/connectors';
import type { ArchiveItemType } from '@dla/archive';

/**
 * Meta EYI adapter (docs/connectors/meta-eyi.md §19). Converts Meta's
 * `GenericPayload` items (Photo/Video/SocialActivity models sent over the DTP
 * Generic Importer protocol) into Bewora's domain, version-tolerantly (§29).
 * Meta-specific field names never leak past this layer.
 */
export interface AdaptedItem {
  type: ArchiveItemType;
  /** Stable provider id for idempotency (§17). */
  sourceItemId: string;
  filename: string;
  mimeType: string;
  createdAtSource?: string;
}

function firstString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v !== '') return v;
  }
  return undefined;
}

function toIso(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // DTP publishes epoch seconds; tolerate ms too.
    const ms = value > 1e12 ? value : value * 1000;
    return new Date(ms).toISOString();
  }
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return value;
  return undefined;
}

/**
 * Adapt a media item (photo/video) metadata payload. `mimeType` is authoritative
 * for the archive type; the payload may nest fields under `payload`.
 */
export function adaptMediaItem(
  meta: Record<string, unknown>,
  fallback: { filename: string; mimeType: string; sourceItemId: string },
): AdaptedItem {
  const p = (meta.payload as Record<string, unknown> | undefined) ?? meta;
  const mimeType = firstString(p, ['mimeType', 'mime_type', 'mime']) ?? fallback.mimeType;
  const filename = firstString(p, ['name', 'filename', 'title']) ?? fallback.filename;
  const sourceItemId = firstString(p, ['dataId', 'data_id', 'id']) ?? fallback.sourceItemId;
  const createdAtSource = toIso(
    p.creationTime ?? p.published ?? p.taken_at ?? p.creation_timestamp,
  );
  return { type: archiveTypeFromMime(mimeType), sourceItemId, filename, mimeType, createdAtSource };
}

/**
 * Adapt a social post/activity payload (text/attachments). Stored as a `post`
 * archive item; media attachments arrive as their own media items.
 */
export function adaptSocialPost(meta: Record<string, unknown>): AdaptedItem {
  const p = (meta.payload as Record<string, unknown> | undefined) ?? meta;
  const activity = (p.activity as Record<string, unknown> | undefined) ?? p;
  const id = firstString(activity, ['id', 'dataId']) ?? `post-${Date.now()}`;
  const title = firstString(activity, ['title', 'content', 'type']) ?? 'Bericht';
  return {
    type: 'post' as ArchiveItemType,
    sourceItemId: id,
    filename: `${title}`.slice(0, 120),
    mimeType: 'text/plain',
    createdAtSource: toIso(activity.published ?? activity.creationTime),
  };
}
