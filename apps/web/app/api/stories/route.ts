import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/security/rate-limit';
import { isDemoSession } from '@/lib/demo-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'verhalen';
const MAX_BYTES = 30 * 1024 * 1024; // ~10 min opus fits easily; headroom for fallbacks

// Map an audio mime type to a file extension. Unknown audio types keep a generic
// extension; non-audio is rejected by the caller.
function extFor(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes('webm')) return 'webm';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('mp4') || m.includes('m4a') || m.includes('aac')) return 'm4a';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('wav')) return 'wav';
  return 'bin';
}

/**
 * Save a recorded story: upload the audio to the private `verhalen` bucket under
 * the owner's folder (RLS), register the row via archive_register_story, and
 * enqueue a `transcribe` job. The audio is the archive piece; the transcript
 * follows in the background.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Keep the shared demo account pristine: accept the recording but don't write.
  if (await isDemoSession(supabase)) return NextResponse.json({ id: 'demo' });

  const limited = rateLimit(`stories:${user.id}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'retry-after': String(limited.retryAfter) } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const audio = form.get('audio');
  const itemId = (form.get('itemId') as string | null)?.trim() || null;
  const albumId = (form.get('albumId') as string | null)?.trim() || null;
  const narratorName = (form.get('narratorName') as string | null)?.trim() || null;
  const narratorPersonId = (form.get('narratorPersonId') as string | null)?.trim() || null;
  const durationRaw = (form.get('durationMs') as string | null) ?? '';
  const durationMs = /^\d+$/.test(durationRaw) ? Number(durationRaw) : null;

  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: 'no_audio' }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: 'too_large' }, { status: 413 });
  }
  if (!audio.type.startsWith('audio/')) {
    return NextResponse.json({ error: 'not_audio' }, { status: 415 });
  }
  if ((itemId ? 1 : 0) + (albumId ? 1 : 0) !== 1) {
    return NextResponse.json({ error: 'target_required' }, { status: 400 });
  }

  const key = `stories/${user.id}/${randomUUID()}.${extFor(audio.type)}`;
  const bytes = new Uint8Array(await audio.arrayBuffer());
  const up = await supabase.storage
    .from(BUCKET)
    .upload(key, bytes, { contentType: audio.type, upsert: false });
  if (up.error) return NextResponse.json({ error: 'upload_failed' }, { status: 502 });

  const { data: storyId, error } = await supabase.rpc('archive_register_story', {
    // The RPC accepts null for the absent target (SQL nullability the type
    // generator can't see); the check-constraint enforces exactly one.
    p_archive_item_id: itemId as unknown as string,
    p_album_id: albumId as unknown as string,
    p_audio_storage_key: key,
    p_audio_mime_type: audio.type,
    p_duration_ms: durationMs ?? undefined,
    p_narrator_person_id: narratorPersonId ?? undefined,
    p_narrator_name: narratorName ?? undefined,
  });
  if (error || !storyId) {
    // Roll back the orphaned upload so a failed register leaves nothing behind.
    await supabase.storage.from(BUCKET).remove([key]);
    return NextResponse.json({ error: 'register_failed' }, { status: 400 });
  }

  // Enqueue transcription via the service role (archive_jobs is worker-owned).
  try {
    const admin = createAdminClient();
    await admin.from('archive_jobs').insert({
      user_id: user.id,
      job_type: 'transcribe',
      status: 'queued',
      run_at: new Date().toISOString(),
      cursor: { story_id: storyId },
    });
  } catch {
    // No service role configured → the story still exists; a later tick can
    // pick up pending transcripts. Never fail the save over transcription.
  }

  return NextResponse.json({ id: storyId });
}
