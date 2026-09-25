'use server';

import { revalidatePath } from 'next/cache';
import type { TablesUpdate } from '@dla/database';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { isDemoSession } from '@/lib/demo-guard';
import { newInviteToken } from '@/lib/events/invite-token';
import { confirmTrustedInvite } from '@/lib/legacy/confirm';

type ScopeKey = 'photos' | 'family' | 'social' | 'documents';

/** Vertaal een scope-sleutel naar de kolom-update (getypt, geen dynamische key). */
function scopeUpdate(scope: ScopeKey, value: boolean): TablesUpdate<'archive_trusted_people'> {
  switch (scope) {
    case 'photos':
      return { scope_photos: value };
    case 'family':
      return { scope_family: value };
    case 'social':
      return { scope_social: value };
    case 'documents':
      return { scope_documents: value };
  }
}

/** Wijs een vertrouwd persoon aan (alleen wensen; geen toegang). */
export async function addTrustedPersonAction(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const email = String(formData.get('email') ?? '').trim() || null;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  const user = await getCurrentUser();
  if (!user) return;
  await supabase.from('archive_trusted_people').insert({ owner_id: user.id, name, email });
  revalidatePath('/nalatenschap');
}

/** Zet één scope aan/uit voor een vertrouwd persoon. */
export async function toggleTrustedScopeAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  const scope = String(formData.get('scope') ?? '') as ScopeKey;
  const value = String(formData.get('value') ?? '') === '1';
  const valid: ScopeKey[] = ['photos', 'family', 'social', 'documents'];
  if (!id || !valid.includes(scope)) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  await supabase.from('archive_trusted_people').update(scopeUpdate(scope, value)).eq('id', id);
  revalidatePath('/nalatenschap');
}

/** Maak een bevestigingslink; bewaart alleen de hash, geeft het token één keer terug. */
export async function createTrustedLinkAction(id: string): Promise<{ token: string } | null> {
  if (!id) return null;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return null;
  const { token, tokenHash } = newInviteToken();
  const { error } = await supabase
    .from('archive_trusted_people')
    .update({ token_hash: tokenHash })
    .eq('id', id);
  if (error) return null;
  revalidatePath('/nalatenschap');
  return { token };
}

/** Verwijder een vertrouwd persoon. */
export async function removeTrustedPersonAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  await supabase.from('archive_trusted_people').delete().eq('id', id);
  revalidatePath('/nalatenschap');
}

/** Publieke bevestiging door de vertrouwde persoon (naam + contact). Geen inlog. */
export async function confirmTrustedAction(
  token: string,
  formData: FormData,
): Promise<{ ok: boolean }> {
  const name = String(formData.get('name') ?? '');
  const contact = String(formData.get('contact') ?? '');
  const ok = await confirmTrustedInvite(token, name, contact);
  return { ok };
}
