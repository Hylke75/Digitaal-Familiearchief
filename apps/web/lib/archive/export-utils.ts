/**
 * Pure helpers for the full-archive export (§40) — no I/O, unit-tested. They
 * turn archive items into safe, collision-free ZIP entry paths and a portable
 * JSON manifest, so the archive stays usable independently of Bewora.
 */

export interface ExportItem {
  id: string;
  original_filename: string;
  type: string;
  mime_type: string;
  file_size: number;
  checksum_sha256: string;
  taken_at: string | null;
  created_at_source: string | null;
  archived_at: string | null;
  latitude: number | null;
  longitude: number | null;
  width: number | null;
  height: number | null;
  camera: string | null;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/json': 'json',
};

const FOLDER_BY_TYPE: Record<string, string> = {
  photo: 'photos',
  video: 'videos',
  document: 'documents',
  post: 'posts',
  message: 'messages',
  audio: 'audio',
  other: 'other',
};

export function extForMime(mime: string): string {
  return EXT_BY_MIME[mime] ?? 'bin';
}

/** Strip path separators + characters unsafe in file names; never empty. */
export function safeBase(name: string): string {
  const base = name
    .replace(/[\\/]+/g, ' ')
    .replace(/[<>:"|?*]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.+$/, '');
  return base || 'bestand';
}

/** A collision-free entry path: `originals/<folder>/<NNNN>_<name>.<ext>`. */
export function exportEntryName(item: ExportItem, index: number): string {
  const folder = FOLDER_BY_TYPE[item.type] ?? 'other';
  const ext = extForMime(item.mime_type);
  const seq = String(index + 1).padStart(4, '0');
  let base = safeBase(item.original_filename);
  // Drop a duplicate extension so we don't get "foo.jpg.jpg".
  base = base.replace(new RegExp(`\\.${ext}$`, 'i'), '');
  return `originals/${folder}/${seq}_${base}.${ext}`;
}

export interface ExportManifest {
  archive: string;
  generatedAt: string;
  itemCount: number;
  truncated: boolean;
  items: Array<{
    file: string;
    title: string;
    type: string;
    mimeType: string;
    fileSize: number;
    checksumSha256: string;
    takenAt: string | null;
    archivedAt: string | null;
    location: { latitude: number; longitude: number } | null;
    dimensions: { width: number; height: number } | null;
    camera: string | null;
  }>;
}

export function buildManifest(
  items: ExportItem[],
  generatedAt: string,
  truncated: boolean,
): ExportManifest {
  return {
    archive: 'Bewora',
    generatedAt,
    itemCount: items.length,
    truncated,
    items: items.map((it, i) => ({
      file: exportEntryName(it, i),
      title: it.original_filename,
      type: it.type,
      mimeType: it.mime_type,
      fileSize: it.file_size,
      checksumSha256: it.checksum_sha256,
      takenAt: it.taken_at ?? it.created_at_source,
      archivedAt: it.archived_at,
      location:
        it.latitude != null && it.longitude != null
          ? { latitude: it.latitude, longitude: it.longitude }
          : null,
      dimensions:
        it.width != null && it.height != null ? { width: it.width, height: it.height } : null,
      camera: it.camera,
    })),
  };
}
