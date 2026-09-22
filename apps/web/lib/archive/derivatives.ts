import sharp from 'sharp';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';
import { thumbnailKey } from '@/lib/archive/derivative-utils';

type Admin = SupabaseClient<Database>;

const BUCKET = 'archief';

// Image types sharp can decode server-side. HEIC/HEIF (the iPhone default) is the
// key reason this exists: Supabase's on-the-fly transform can't decode it, so
// without a generated derivative those photos have no preview at all.
const THUMBABLE = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/tiff',
]);

/**
 * Generate persisted 600px webp thumbnails for a bounded batch of photo items
 * that don't have one yet (docs/ARCHIVE_EXPERIENCE_AUDIT.md §8.2). Runs under the
 * service role in the cron worker. Idempotent: existing thumbs are skipped, and a
 * single unreadable image never blocks the batch. Returns how many were made.
 */
export async function generateThumbnailBatch(admin: Admin, limit = 12): Promise<number> {
  const { data: candidates } = await admin
    .from('archive_items')
    .select('id, owner_id, storage_key, mime_type')
    .eq('type', 'photo')
    .order('archived_at', { ascending: false })
    .limit(limit * 4);
  if (!candidates || candidates.length === 0) return 0;

  const ids = candidates.map((c) => c.id);
  const { data: existing } = await admin
    .from('archive_derivatives')
    .select('archive_item_id')
    .eq('kind', 'thumb')
    .in('archive_item_id', ids);
  const have = new Set((existing ?? []).map((e) => e.archive_item_id));

  const todo = candidates
    .filter((c) => !have.has(c.id) && THUMBABLE.has(c.mime_type))
    .slice(0, limit);

  let made = 0;
  for (const item of todo) {
    try {
      const { data: blob } = await admin.storage.from(BUCKET).download(item.storage_key);
      if (!blob) continue;
      const input = Buffer.from(await blob.arrayBuffer());
      const { data: out, info } = await sharp(input, { failOn: 'none' })
        .rotate() // honour EXIF orientation
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 60 })
        .toBuffer({ resolveWithObject: true });

      const key = thumbnailKey(item.owner_id, item.id);
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(key, out, { contentType: 'image/webp', upsert: true });
      if (upErr) continue;

      await admin.from('archive_derivatives').upsert(
        {
          archive_item_id: item.id,
          owner_id: item.owner_id,
          kind: 'thumb',
          storage_key: key,
          mime_type: 'image/webp',
          width: info.width,
          height: info.height,
          byte_size: out.length,
        },
        { onConflict: 'archive_item_id,kind', ignoreDuplicates: true },
      );
      made += 1;
    } catch {
      // Corrupt/undecodable image → skip; a later tick may retry. Never throws.
    }
  }
  return made;
}
