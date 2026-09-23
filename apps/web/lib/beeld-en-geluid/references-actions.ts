'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { buildReference } from './references';
import { insertReference, deleteReference } from './references-db';

export interface ReferenceFormState {
  error?: 'invalidUrl' | 'missingTitle' | 'invalidFragment' | 'notAuthenticated';
  ok?: boolean;
}

/**
 * Attach a Beeld & Geluid / Schatkamer "media moment" to the archive. Link-only:
 * we validate the pasted URL (SSRF-safe, allowlisted host) and store the
 * personal memory + an official link — never a copy of protected media, and no
 * automated Schatkamer access.
 */
export async function addMediaMomentAction(
  _prev: ReferenceFormState,
  formData: FormData,
): Promise<ReferenceFormState> {
  const built = buildReference({
    url: String(formData.get('url') ?? ''),
    title: String(formData.get('title') ?? ''),
    note: String(formData.get('note') ?? ''),
    broadcastNote: String(formData.get('broadcastNote') ?? ''),
    fragmentStart: String(formData.get('fragmentStart') ?? ''),
    fragmentEnd: String(formData.get('fragmentEnd') ?? ''),
  });
  if (!built.ok) return { error: built.error };

  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return { error: 'notAuthenticated' };

  await insertReference(supabase, user.id, built.row);
  revalidatePath('/media-momenten');
  return { ok: true };
}

/** Remove a media moment (the archived memory reference, not any B&G media). */
export async function deleteMediaMomentAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return;
  await deleteReference(supabase, user.id, id);
  revalidatePath('/media-momenten');
}
