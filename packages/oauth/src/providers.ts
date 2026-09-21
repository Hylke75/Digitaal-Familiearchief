import type { OAuthProviderConfig } from './types';

/**
 * Verified OAuth provider configurations (2026-09-19). Scopes and authorize
 * params reflect current official docs; see docs/connectors/*.md and
 * docs/connectors/ARCHITECTURE.md for the reasoning and source links.
 */

export const GOOGLE_DRIVE_OAUTH: OAuthProviderConfig = {
  key: 'google_drive',
  authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  // drive.readonly is a RESTRICTED scope (verification + CASA). Full archival
  // requires it; drive.file is not equivalent.
  scopes: ['https://www.googleapis.com/auth/drive.readonly', 'openid', 'email', 'profile'],
  usePkce: true,
  // access_type=offline + prompt=consent are required to (re)issue a refresh token.
  extraAuthorizeParams: {
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  },
};

export const ONEDRIVE_OAUTH: OAuthProviderConfig = {
  key: 'onedrive',
  // /consumers = personal Microsoft accounts only.
  authorizeUrl: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
  scopes: ['Files.Read', 'offline_access', 'User.Read', 'openid', 'email', 'profile'],
  usePkce: true,
  extraAuthorizeParams: { response_mode: 'query' },
};

export const DROPBOX_OAUTH: OAuthProviderConfig = {
  key: 'dropbox',
  authorizeUrl: 'https://www.dropbox.com/oauth2/authorize',
  tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
  scopes: ['files.metadata.read', 'files.content.read', 'account_info.read'],
  usePkce: true,
  // token_access_type=offline is required to receive a refresh token.
  extraAuthorizeParams: { token_access_type: 'offline' },
};

export const TIKTOK_OAUTH: OAuthProviderConfig = {
  key: 'tiktok',
  // Login Kit v2. TikTok uses `client_key` instead of `client_id`.
  authorizeUrl: 'https://www.tiktok.com/v2/auth/authorize/',
  tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
  // posts + profile only (no direct messages unless separately approved).
  scopes: ['user.info.basic', 'portability.postsandprofile.single'],
  usePkce: true,
  clientIdParam: 'client_key',
};

export const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  google_drive: GOOGLE_DRIVE_OAUTH,
  onedrive: ONEDRIVE_OAUTH,
  dropbox: DROPBOX_OAUTH,
  tiktok: TIKTOK_OAUTH,
};

export function getOAuthProvider(key: string): OAuthProviderConfig | undefined {
  return OAUTH_PROVIDERS[key];
}
