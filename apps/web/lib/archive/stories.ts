import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'verhalen';
// A few-hours signed audio URL (same rationale as thumbnails); the player
// recovers from expiry via /api/stories/audio/[id] (§signed-URL refresh).
const SIGNED_TTL = 60 * 60 * 4;

export type TranscriptStatus = Database['public']['Enums']['transcript_status'];

export interface StoryView {
  id: string;
  audioUrl: string | null;
  audioMimeType: string;
  durationMs: number | null;
  transcript: string | null;
  transcriptStatus: TranscriptStatus;
  narratorName: string | null;
  source: Database['public']['Enums']['story_source'];
  approved: boolean;
  createdAt: string;
}

type StoryRow = Database['public']['Tables']['archive_stories']['Row'];

function toView(row: StoryRow, audioUrl: string | null): StoryView {
  return {
    id: row.id,
    audioUrl,
    audioMimeType: row.audio_mime_type,
    durationMs: row.duration_ms,
    transcript: row.transcript,
    transcriptStatus: row.transcript_status,
    narratorName: row.narrator_name,
    source: row.source,
    approved: row.approved,
    createdAt: row.created_at,
  };
}

/**
 * The owner's stories for one item, newest first, each with a signed audio URL.
 * RLS restricts to the owner, so this includes their own not-yet-approved guest
 * stories (shown in a review state on the detail page). Timeline/search filter
 * on `approved` separately.
 */
export async function listStoriesForItem(itemId: string): Promise<StoryView[]> {
  return listStoriesWhere('archive_item_id', itemId);
}

/** The owner's stories for a whole album/period, newest first. */
export async function listStoriesForAlbum(albumId: string): Promise<StoryView[]> {
  return listStoriesWhere('album_id', albumId);
}

async function listStoriesWhere(
  column: 'archive_item_id' | 'album_id',
  value: string,
): Promise<StoryView[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('archive_stories')
    .select('*')
    .eq(column, value)
    .order('created_at', { ascending: false });
  const rows = (data ?? []) as StoryRow[];
  if (rows.length === 0) return [];

  const keys = [...new Set(rows.map((r) => r.audio_storage_key))];
  const signed = new Map<string, string>();
  const { data: urls } = await supabase.storage.from(BUCKET).createSignedUrls(keys, SIGNED_TTL);
  (urls ?? []).forEach((u) => {
    if (u.signedUrl && u.path) signed.set(u.path, u.signedUrl);
  });

  return rows.map((r) => toView(r, signed.get(r.audio_storage_key) ?? null));
}

/** Item ids (from a candidate set) that have at least one APPROVED story — for
 * the timeline speaker icon. One query, RLS-scoped. */
export async function itemsWithStory(itemIds: string[]): Promise<Set<string>> {
  if (itemIds.length === 0) return new Set();
  const supabase = createClient();
  const { data } = await supabase
    .from('archive_stories')
    .select('archive_item_id')
    .eq('approved', true)
    .in('archive_item_id', itemIds);
  const out = new Set<string>();
  (data ?? []).forEach((r) => {
    if (r.archive_item_id) out.add(r.archive_item_id);
  });
  return out;
}

/** A fresh signed URL for one story's audio (RLS-scoped) — used by the player to
 * recover from an expired link. Returns null when not found/owned. */
export async function signStoryAudio(
  supabase: SupabaseClient<Database>,
  storyId: string,
): Promise<string | null> {
  const { data: row } = await supabase
    .from('archive_stories')
    .select('audio_storage_key')
    .eq('id', storyId)
    .maybeSingle();
  if (!row?.audio_storage_key) return null;
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.audio_storage_key, SIGNED_TTL);
  return data?.signedUrl ?? null;
}
