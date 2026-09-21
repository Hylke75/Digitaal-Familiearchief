import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';
import { SupabaseStorageProvider } from '@/lib/archive/supabase-storage';
import {
  AUTH_CODE_TTL_MS,
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  generateToken,
  hashToken,
  expiryFrom,
  isExpired,
  redirectUriMatches,
} from './tokens';
import type { MetaIngestPort } from './ingestion';

type Admin = SupabaseClient<Database>;

/**
 * Destination-OAuth lifecycle + transfer archiving, all under the service role
 * (Meta authenticates against Bewora and has no Bewora user session). Tokens and
 * codes are persisted only as SHA-256 hashes (docs/connectors/meta-eyi.md §9).
 */

export interface MetaClient {
  clientId: string;
  clientSecretHash: string;
  redirectUris: string[];
}

export async function findClient(admin: Admin, clientId: string): Promise<MetaClient | null> {
  const { data } = await admin
    .from('meta_oauth_clients')
    .select('client_id, client_secret_hash, redirect_uris')
    .eq('client_id', clientId)
    .maybeSingle();
  if (!data) return null;
  return {
    clientId: data.client_id,
    clientSecretHash: data.client_secret_hash,
    redirectUris: data.redirect_uris ?? [],
  };
}

/** Issue a short-lived, single-use authorization code (returns the RAW code). */
export async function issueAuthCode(
  admin: Admin,
  input: {
    clientId: string;
    userId: string;
    connectorAccountId: string;
    redirectUri: string;
    scope?: string;
  },
): Promise<string> {
  const code = generateToken();
  await admin.from('meta_oauth_codes').insert({
    code_hash: hashToken(code),
    client_id: input.clientId,
    user_id: input.userId,
    connector_account_id: input.connectorAccountId,
    redirect_uri: input.redirectUri,
    scope: input.scope ?? null,
    expires_at: expiryFrom(AUTH_CODE_TTL_MS),
  });
  return code;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

async function mintTokens(
  admin: Admin,
  base: {
    clientId: string;
    userId: string;
    connectorAccountId: string | null;
    scope: string | null;
  },
): Promise<IssuedTokens> {
  const accessToken = generateToken();
  const refreshToken = generateToken();
  await admin.from('meta_oauth_tokens').insert({
    access_token_hash: hashToken(accessToken),
    refresh_token_hash: hashToken(refreshToken),
    client_id: base.clientId,
    user_id: base.userId,
    connector_account_id: base.connectorAccountId,
    scope: base.scope,
    access_expires_at: expiryFrom(ACCESS_TOKEN_TTL_MS),
    refresh_expires_at: expiryFrom(REFRESH_TOKEN_TTL_MS),
  });
  return { accessToken, refreshToken, expiresIn: Math.floor(ACCESS_TOKEN_TTL_MS / 1000) };
}

/** Exchange an authorization code for tokens (single-use; validates client+redirect). */
export async function exchangeCode(
  admin: Admin,
  input: { code: string; clientId: string; redirectUri: string },
): Promise<IssuedTokens | { error: string }> {
  const { data: row } = await admin
    .from('meta_oauth_codes')
    .select('*')
    .eq('code_hash', hashToken(input.code))
    .maybeSingle();
  if (!row || row.used) return { error: 'invalid_grant' };
  if (row.client_id !== input.clientId) return { error: 'invalid_client' };
  if (!redirectUriMatches(input.redirectUri, [row.redirect_uri])) return { error: 'invalid_grant' };
  if (isExpired(row.expires_at)) return { error: 'invalid_grant' };
  await admin.from('meta_oauth_codes').update({ used: true }).eq('id', row.id);
  return mintTokens(admin, {
    clientId: row.client_id,
    userId: row.user_id,
    connectorAccountId: row.connector_account_id,
    scope: row.scope,
  });
}

/** Rotate a refresh token: mint new tokens, revoke the presented one. */
export async function refreshTokens(
  admin: Admin,
  input: { refreshToken: string; clientId: string },
): Promise<IssuedTokens | { error: string }> {
  const { data: row } = await admin
    .from('meta_oauth_tokens')
    .select('*')
    .eq('refresh_token_hash', hashToken(input.refreshToken))
    .maybeSingle();
  if (!row || row.revoked || row.client_id !== input.clientId) return { error: 'invalid_grant' };
  if (row.refresh_expires_at && isExpired(row.refresh_expires_at))
    return { error: 'invalid_grant' };
  await admin.from('meta_oauth_tokens').update({ revoked: true }).eq('id', row.id); // rotation
  return mintTokens(admin, {
    clientId: row.client_id,
    userId: row.user_id,
    connectorAccountId: row.connector_account_id,
    scope: row.scope,
  });
}

/** Resolve a Bearer access token to its owner (importer auth). */
export async function resolveAccessToken(
  admin: Admin,
  accessToken: string,
): Promise<{ userId: string; connectorAccountId: string | null } | null> {
  const { data: row } = await admin
    .from('meta_oauth_tokens')
    .select('user_id, connector_account_id, access_expires_at, revoked')
    .eq('access_token_hash', hashToken(accessToken))
    .maybeSingle();
  if (!row || row.revoked || isExpired(row.access_expires_at)) return null;
  return { userId: row.user_id, connectorAccountId: row.connector_account_id };
}

export async function revokeByRefreshToken(admin: Admin, refreshToken: string): Promise<void> {
  await admin
    .from('meta_oauth_tokens')
    .update({ revoked: true })
    .eq('refresh_token_hash', hashToken(refreshToken));
}

/** Ensure a connector_account exists for (user, meta platform). */
export async function ensureConnectorAccount(
  admin: Admin,
  userId: string,
  connectorKey: 'facebook' | 'instagram',
): Promise<string> {
  const { data: existing } = await admin
    .from('connector_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('connector_key', connectorKey)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await admin
    .from('connector_accounts')
    .insert({
      user_id: userId,
      connector_key: connectorKey,
      status: 'connected',
      connected_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error || !data) throw error ?? new Error('connector account insert failed');
  return data.id;
}

/** An ingest port backed by the service role — writes archive rows for the
 * resolved owner (dedup on owner+checksum). Reuses the tested ingestion logic. */
export function adminIngestPort(admin: Admin, userId: string): MetaIngestPort {
  const storage = new SupabaseStorageProvider(admin);
  return {
    async putBytes(key, bytes, mimeType, checksum) {
      await storage.put(key, bytes, { contentType: mimeType, checksumSha256: checksum });
    },
    async ingest(input) {
      const { data: existing } = await admin
        .from('archive_items')
        .select('id')
        .eq('owner_id', userId)
        .eq('checksum_sha256', input.checksumSha256)
        .maybeSingle();
      let itemId = existing?.id;
      if (!itemId) {
        const { data: inserted } = await admin
          .from('archive_items')
          .insert({
            owner_id: userId,
            type: input.type,
            original_filename: input.originalFilename,
            mime_type: input.mimeType,
            file_size: input.fileSize,
            checksum_sha256: input.checksumSha256,
            created_at_source: input.createdAtSource ?? null,
            archived_at: new Date().toISOString(),
            storage_provider: input.storageProvider,
            storage_key: input.storageKey,
            status: 'archived',
          })
          .select('id')
          .single();
        itemId = inserted?.id;
      }
      if (itemId) {
        await admin.from('archive_item_sources').upsert(
          {
            archive_item_id: itemId,
            connector_account_id: input.connectorAccountId,
            source_item_id: input.sourceItemId,
          },
          {
            onConflict: 'archive_item_id,connector_account_id,source_item_id',
            ignoreDuplicates: true,
          },
        );
      }
      return { deduped: Boolean(existing) };
    },
  };
}
