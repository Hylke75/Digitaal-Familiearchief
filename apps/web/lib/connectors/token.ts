import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';
import { AesGcmTokenEncryption } from '@dla/security';
import { refreshAccessToken, type FetchLike } from '@dla/oauth';
import type { ConnectProvider } from './live-providers';

const globalFetch = fetch as unknown as FetchLike;

function encryption(): AesGcmTokenEncryption {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error('TOKEN_ENCRYPTION_KEY is not configured');
  return AesGcmTokenEncryption.fromBase64(key);
}

/** Encrypt + store a provider refresh token for a connector account (via RPC). */
export async function encryptRefreshToken(refreshToken: string) {
  return encryption().encrypt(refreshToken);
}

/**
 * Obtain a fresh access token for a connected account: decrypt the stored refresh
 * token (service role), exchange it, and persist a rotated refresh token if the
 * provider returned a new one (Microsoft rotates on every use).
 */
export async function getAccessToken(
  admin: SupabaseClient<Database>,
  connectorAccountId: string,
  provider: ConnectProvider,
): Promise<string> {
  const { data: cred } = await admin
    .from('connector_credentials')
    .select('scheme, ciphertext')
    .eq('connector_account_id', connectorAccountId)
    .eq('kind', provider.credentialKind)
    .maybeSingle();
  if (!cred) throw new Error('no stored credential for account');

  const enc = encryption();
  const refreshToken = await enc.decrypt({ scheme: cred.scheme, ciphertext: cred.ciphertext });
  const tokens = await refreshAccessToken(
    provider.oauth,
    provider.makeClient(),
    refreshToken,
    globalFetch,
  );

  if (tokens.refreshToken && tokens.refreshToken !== refreshToken) {
    const reencrypted = await enc.encrypt(tokens.refreshToken);
    await admin
      .from('connector_credentials')
      .update({ scheme: reencrypted.scheme, ciphertext: reencrypted.ciphertext })
      .eq('connector_account_id', connectorAccountId)
      .eq('kind', provider.credentialKind);
  }

  return tokens.accessToken;
}
