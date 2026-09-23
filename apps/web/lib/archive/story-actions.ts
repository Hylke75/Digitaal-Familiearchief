'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isDemoSession } from '@/lib/demo-guard';

const BUCKET = 'verhalen';

/** Correct the written-out text (the audio always stays the archive piece). */
export async function updateStoryTranscriptAction(storyId: string, text: string): Promise<void> {
  if (!storyId) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  await supabase
    .from('archive_stories')
    .update({ transcript: text, transcript_status: 'done' })
    .eq('id', storyId);
  revalidatePath('/');
}

/** Rename the narrator (e.g. after a guest story arrives). */
export async function renameStoryNarratorAction(formData: FormData): Promise<void> {
  const storyId = String(formData.get('storyId') ?? '');
  const name = String(formData.get('narratorName') ?? '').trim();
  if (!storyId || !name) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  await supabase.from('archive_stories').update({ narrator_name: name }).eq('id', storyId);
  revalidatePath('/');
}

/** Approve a guest story so it becomes visible in the archive. */
export async function approveStoryAction(formData: FormData): Promise<void> {
  const storyId = String(formData.get('storyId') ?? '');
  if (!storyId) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  await supabase.from('archive_stories').update({ approved: true }).eq('id', storyId);
  revalidatePath('/');
}

/** Delete a story: remove the row (RLS) and its audio object. The audio is the
 * archive piece, so this is deliberate and owner-only. */
export async function deleteStoryAction(formData: FormData): Promise<void> {
  const storyId = String(formData.get('storyId') ?? '');
  if (!storyId) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  const { data: row } = await supabase
    .from('archive_stories')
    .select('audio_storage_key')
    .eq('id', storyId)
    .maybeSingle();
  await supabase.from('archive_stories').delete().eq('id', storyId);
  if (row?.audio_storage_key) {
    await supabase.storage.from(BUCKET).remove([row.audio_storage_key]);
  }
  revalidatePath('/');
}

/** Re-queue a failed transcription. */
export async function retryTranscribeAction(formData: FormData): Promise<void> {
  const storyId = String(formData.get('storyId') ?? '');
  if (!storyId) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('archive_stories').update({ transcript_status: 'pending' }).eq('id', storyId);
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
    // Worker will still pick up pending stories on a later tick.
  }
  revalidatePath('/');
}
