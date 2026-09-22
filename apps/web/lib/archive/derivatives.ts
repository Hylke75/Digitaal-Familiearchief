import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';
import { posterKey, thumbnailKey } from '@/lib/archive/derivative-utils';

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

/** Extract a representative frame from a video as PNG bytes, or null. Uses the
 * bundled ffmpeg-static binary via a temp file; bounded by a hard timeout so a
 * hung decode never occupies the worker. Returns null if ffmpeg is unavailable
 * (e.g. not bundled) — callers degrade gracefully to no poster. */
async function extractVideoFrame(bytes: Uint8Array): Promise<Buffer | null> {
  if (!ffmpegPath) return null;
  const dir = await mkdtemp(join(tmpdir(), 'poster-'));
  const inFile = join(dir, 'in');
  const outFile = join(dir, 'out.png');
  try {
    await writeFile(inFile, bytes);
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(
        ffmpegPath as string,
        ['-y', '-i', inFile, '-frames:v', '1', '-vf', 'scale=600:-1', '-f', 'image2', outFile],
        { stdio: 'ignore' },
      );
      const timer = setTimeout(() => {
        proc.kill('SIGKILL');
        reject(new Error('ffmpeg timeout'));
      }, 25_000);
      proc.on('error', (e) => {
        clearTimeout(timer);
        reject(e);
      });
      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exit ${code}`));
      });
    });
    return await readFile(outFile);
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Generate persisted 600px webp posters for a bounded batch of video items that
 * don't have one yet. Same idempotent/best-effort contract as thumbnails; runs
 * under the service role in the cron worker. Returns how many were made.
 */
export async function generateVideoPosterBatch(admin: Admin, limit = 4): Promise<number> {
  if (!ffmpegPath) return 0;
  const { data: candidates } = await admin
    .from('archive_items')
    .select('id, owner_id, storage_key')
    .eq('type', 'video')
    .order('archived_at', { ascending: false })
    .limit(limit * 4);
  if (!candidates || candidates.length === 0) return 0;

  const ids = candidates.map((c) => c.id);
  const { data: existing } = await admin
    .from('archive_derivatives')
    .select('archive_item_id')
    .eq('kind', 'poster')
    .in('archive_item_id', ids);
  const have = new Set((existing ?? []).map((e) => e.archive_item_id));
  const todo = candidates.filter((c) => !have.has(c.id)).slice(0, limit);

  let made = 0;
  for (const item of todo) {
    try {
      const { data: blob } = await admin.storage.from(BUCKET).download(item.storage_key);
      if (!blob) continue;
      const frame = await extractVideoFrame(new Uint8Array(await blob.arrayBuffer()));
      if (!frame) continue;
      const { data: out, info } = await sharp(frame, { failOn: 'none' })
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 60 })
        .toBuffer({ resolveWithObject: true });

      const key = posterKey(item.owner_id, item.id);
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(key, out, { contentType: 'image/webp', upsert: true });
      if (upErr) continue;

      await admin.from('archive_derivatives').upsert(
        {
          archive_item_id: item.id,
          owner_id: item.owner_id,
          kind: 'poster',
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
      // Undecodable video → skip. Never throws.
    }
  }
  return made;
}
