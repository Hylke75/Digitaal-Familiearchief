import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';
import { getTranscriber } from '@/lib/stories/transcriber';

type Admin = SupabaseClient<Database>;
type JobRow = Database['public']['Tables']['archive_jobs']['Row'];

const BUCKET = 'verhalen';

async function finishJob(
  admin: Admin,
  jobId: string,
  status: 'completed' | 'failed',
  error?: string,
) {
  await admin
    .from('archive_jobs')
    .update({ status, completed_at: new Date().toISOString(), last_error: error ?? null })
    .eq('id', jobId);
}

/**
 * Process one `transcribe` job: read the story, fetch its audio under the
 * service role, run speech-to-text, and store the transcript. The audio is never
 * touched — a failed transcription just leaves the story with status `failed`
 * and a retry button. Vault items are never sent to an external service (the
 * vault doesn't exist yet; the guard lands with it).
 */
export async function transcribeJob(admin: Admin, job: JobRow): Promise<void> {
  const storyId = (job.cursor as { story_id?: string } | null)?.story_id;
  if (!storyId) return finishJob(admin, job.id, 'completed');

  const { data: story } = await admin
    .from('archive_stories')
    .select('id, audio_storage_key, audio_mime_type, transcript_status')
    .eq('id', storyId)
    .maybeSingle();
  if (!story) return finishJob(admin, job.id, 'completed'); // story deleted meanwhile
  if (story.transcript_status === 'done') return finishJob(admin, job.id, 'completed');

  const transcriber = getTranscriber();
  if (!transcriber) {
    await admin.from('archive_stories').update({ transcript_status: 'failed' }).eq('id', storyId);
    return finishJob(admin, job.id, 'failed', 'no transcriber configured');
  }

  await admin.from('archive_stories').update({ transcript_status: 'processing' }).eq('id', storyId);

  try {
    const { data: blob } = await admin.storage.from(BUCKET).download(story.audio_storage_key);
    if (!blob) throw new Error('audio missing');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const text = await transcriber.transcribe(bytes, story.audio_mime_type);
    await admin
      .from('archive_stories')
      .update({ transcript: text, transcript_status: 'done' })
      .eq('id', storyId);
    await finishJob(admin, job.id, 'completed');
  } catch (e) {
    await admin.from('archive_stories').update({ transcript_status: 'failed' }).eq('id', storyId);
    await finishJob(admin, job.id, 'failed', String((e as Error).message).slice(0, 300));
  }
}
