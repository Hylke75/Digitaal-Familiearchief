import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/current-user';
import {
  toMoment,
  type InsertableReference,
  type MediaMoment,
  type ReferenceRow,
} from './references';

const TABLE = 'archive_external_references';

/** The owner's media moments, newest first (RLS restricts to the owner). */
export async function listMediaMoments(): Promise<MediaMoment[]> {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  return ((data ?? []) as ReferenceRow[]).map(toMoment);
}

/** Insert a validated reference for the current owner (RLS-scoped). */
export async function insertReference(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  row: InsertableReference,
): Promise<void> {
  await supabase.from(TABLE).insert({ ...row, owner_id: ownerId, provider: 'beeld_en_geluid' });
}

/** Delete one of the owner's references (RLS also enforces ownership). */
export async function deleteReference(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  id: string,
): Promise<void> {
  await supabase.from(TABLE).delete().eq('id', id).eq('owner_id', ownerId);
}
