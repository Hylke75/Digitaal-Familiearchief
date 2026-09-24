'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { isDemoSession } from '@/lib/demo-guard';
import { newInviteToken } from '@/lib/events/invite-token';

const isoDate = (v: FormDataEntryValue | null): string | null => {
  const s = typeof v === 'string' ? v.trim() : '';
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};

/** Maak een gebeurtenis en ga ernaartoe. */
export async function createEventAction(formData: FormData): Promise<void> {
  const title = String(formData.get('title') ?? '').trim();
  if (!title) return;
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/inloggen');
  if (await isDemoSession(supabase)) redirect('/gebeurtenissen');

  const { data, error } = await supabase
    .from('archive_events')
    .insert({ owner_id: user.id, title, happened_on: isoDate(formData.get('happenedOn')) })
    .select('id')
    .single();
  if (error || !data) return;
  revalidatePath('/gebeurtenissen');
  redirect(`/gebeurtenissen/${data.id}`);
}

/** Voeg eigen items toe aan een gebeurtenis (meteen goedgekeurd). */
export async function addOwnItemsToEventAction(eventId: string, itemIds: string[]): Promise<void> {
  if (!eventId || itemIds.length === 0) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  await supabase.from('archive_event_items').upsert(
    itemIds.map((id) => ({ event_id: eventId, archive_item_id: id, approved: true })),
    { onConflict: 'event_id,archive_item_id', ignoreDuplicates: true },
  );
  revalidatePath(`/gebeurtenissen/${eventId}`);
}

/** Keur een gastbijdrage goed: zichtbaar maken + approved=true. */
export async function approveEventItemAction(formData: FormData): Promise<void> {
  const eventItemId = String(formData.get('eventItemId') ?? '');
  const eventId = String(formData.get('eventId') ?? '');
  if (!eventItemId) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  const user = await getCurrentUser();
  if (!user) return;

  const { data: row } = await supabase
    .from('archive_event_items')
    .select('archive_item_id')
    .eq('id', eventItemId)
    .maybeSingle();
  if (!row) return;
  await Promise.all([
    supabase.from('archive_event_items').update({ approved: true }).eq('id', eventItemId),
    supabase
      .from('archive_item_flags')
      .upsert([{ owner_id: user.id, archive_item_id: row.archive_item_id, hidden: false }], {
        onConflict: 'owner_id,archive_item_id',
      }),
  ]);
  revalidatePath(`/gebeurtenissen/${eventId}`);
  revalidatePath('/mijn-leven');
}

/** Wijs een gastbijdrage af: verwijder het item (via service role — de gast-upload
 * hoort niet in het archief). */
export async function rejectEventItemAction(formData: FormData): Promise<void> {
  const eventItemId = String(formData.get('eventItemId') ?? '');
  const eventId = String(formData.get('eventId') ?? '');
  if (!eventItemId) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  const { data: row } = await supabase
    .from('archive_event_items')
    .select('archive_item_id')
    .eq('id', eventItemId)
    .maybeSingle();
  if (!row) return;
  try {
    const admin = createAdminClient();
    const { data: item } = await admin
      .from('archive_items')
      .select('storage_key')
      .eq('id', row.archive_item_id)
      .maybeSingle();
    await admin.from('archive_items').delete().eq('id', row.archive_item_id);
    if (item?.storage_key) {
      const { count } = await admin
        .from('archive_items')
        .select('id', { count: 'exact', head: true })
        .eq('storage_key', item.storage_key);
      if ((count ?? 0) === 0) await admin.storage.from('archief').remove([item.storage_key]);
    }
  } catch {
    // No service role → leave the item; the owner can hide it instead.
  }
  revalidatePath(`/gebeurtenissen/${eventId}`);
}

/** Maak een uitnodigingslink; bewaart alleen de hash, geeft het token één keer terug. */
export async function createInviteAction(
  eventId: string,
  recipientLabel: string,
): Promise<{ token: string } | null> {
  if (!eventId) return null;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const { token, tokenHash } = newInviteToken();
  const { error } = await supabase.from('archive_event_invites').insert({
    event_id: eventId,
    owner_id: user.id,
    token_hash: tokenHash,
    recipient_label: recipientLabel.trim() || null,
  });
  if (error) return null;
  revalidatePath(`/gebeurtenissen/${eventId}`);
  return { token };
}

/** Trek een uitnodiging in. */
export async function revokeInviteAction(formData: FormData): Promise<void> {
  const inviteId = String(formData.get('inviteId') ?? '');
  const eventId = String(formData.get('eventId') ?? '');
  if (!inviteId) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  await supabase
    .from('archive_event_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', inviteId);
  revalidatePath(`/gebeurtenissen/${eventId}`);
}

/** Zet aan/uit of gasten de goedgekeurde foto's van de gebeurtenis zien. */
export async function setGuestsSeePhotosAction(formData: FormData): Promise<void> {
  const eventId = String(formData.get('eventId') ?? '');
  const value = String(formData.get('value') ?? '') === '1';
  if (!eventId) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  await supabase.from('archive_events').update({ guests_see_photos: value }).eq('id', eventId);
  revalidatePath(`/gebeurtenissen/${eventId}`);
}

/** Verwijder een gebeurtenis (de foto's blijven; alleen de groepering gaat weg). */
export async function deleteEventAction(formData: FormData): Promise<void> {
  const eventId = String(formData.get('eventId') ?? '');
  if (!eventId) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) redirect('/gebeurtenissen');
  await supabase.from('archive_events').delete().eq('id', eventId);
  revalidatePath('/gebeurtenissen');
  redirect('/gebeurtenissen');
}
