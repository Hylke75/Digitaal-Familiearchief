import { createAdminClient } from '@/lib/supabase/admin';
import { hashInviteToken } from '@/lib/events/invite-token';

/**
 * Publieke bevestiging voor een vertrouwd persoon. De tabel is owner-only, dus
 * de service role zoekt op de hash van het token — de persoon leest/schrijft
 * nooit rechtstreeks. Er wordt GEEN archieftoegang verleend; alleen naam/contact
 * wordt vastgelegd zodat de eigenaar weet dat de persoon bereikbaar is.
 */
export interface TrustedInvite {
  id: string;
  name: string;
  alreadyConfirmed: boolean;
}

export async function resolveTrustedInvite(token: string): Promise<TrustedInvite | null> {
  const clean = (token ?? '').trim();
  if (!clean) return null;
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return null;
  }
  const { data } = await admin
    .from('archive_trusted_people')
    .select('id, name, confirmed_at')
    .eq('token_hash', hashInviteToken(clean))
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, name: data.name, alreadyConfirmed: Boolean(data.confirmed_at) };
}

/** Leg de bevestiging vast (naam + contact). Idempotent-veilig op de hash. */
export async function confirmTrustedInvite(
  token: string,
  confirmedName: string,
  confirmedContact: string,
): Promise<boolean> {
  const clean = (token ?? '').trim();
  if (!clean) return false;
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return false;
  }
  const { error } = await admin
    .from('archive_trusted_people')
    .update({
      confirmed_at: new Date().toISOString(),
      confirmed_name: confirmedName.trim().slice(0, 120) || null,
      confirmed_contact: confirmedContact.trim().slice(0, 200) || null,
    })
    .eq('token_hash', hashInviteToken(clean));
  return !error;
}
