import { createAdminClient } from '@/lib/supabase/admin';
import { hashInviteToken } from '@/lib/events/invite-token';

export interface GuestInvite {
  inviteId: string;
  eventId: string;
  ownerId: string;
  title: string;
  happenedOn: string | null;
  description: string | null;
  guestsSeePhotos: boolean;
  recipientLabel: string | null;
}

/**
 * Resolve a pasted invite token to its event, or null when the link is invalid,
 * expired or revoked. Uses the service role because the invites table is
 * owner-only; the guest never reads it directly. Matching is on the hash — the
 * token itself is never stored.
 */
export async function resolveInvite(token: string): Promise<GuestInvite | null> {
  const clean = (token ?? '').trim();
  if (!clean) return null;
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return null; // no service role configured
  }
  const { data: invite } = await admin
    .from('archive_event_invites')
    .select('id, event_id, owner_id, expires_at, revoked_at')
    .eq('token_hash', hashInviteToken(clean))
    .maybeSingle();
  if (!invite || invite.revoked_at || new Date(invite.expires_at).getTime() < Date.now()) {
    return null;
  }
  const { data: event } = await admin
    .from('archive_events')
    .select('id, title, happened_on, description, guests_see_photos')
    .eq('id', invite.event_id)
    .maybeSingle();
  if (!event) return null;
  const { data: inviteLabel } = await admin
    .from('archive_event_invites')
    .select('recipient_label')
    .eq('id', invite.id)
    .maybeSingle();
  return {
    inviteId: invite.id,
    eventId: invite.event_id,
    ownerId: invite.owner_id,
    title: event.title,
    happenedOn: event.happened_on,
    description: event.description,
    guestsSeePhotos: event.guests_see_photos,
    recipientLabel: inviteLabel?.recipient_label ?? null,
  };
}
