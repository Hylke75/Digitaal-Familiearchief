import { describe, expect, it } from 'vitest';
import { buildAuthorizeUrl, exchangeCode, refreshAccessToken } from './client';
import { DROPBOX_OAUTH, GOOGLE_DRIVE_OAUTH, ONEDRIVE_OAUTH, getOAuthProvider } from './providers';
import { OAuthError, type FetchLike } from './types';

const client = {
  clientId: 'cid',
  clientSecret: 'secret',
  redirectUri: 'https://bewora.nl/auth/google_drive/callback',
};

describe('authorize URL', () => {
  it('builds a Google URL with PKCE + offline access', () => {
    const url = new URL(
      buildAuthorizeUrl(GOOGLE_DRIVE_OAUTH, client, { state: 'st', codeChallenge: 'ch' }),
    );
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    const p = url.searchParams;
    expect(p.get('client_id')).toBe('cid');
    expect(p.get('response_type')).toBe('code');
    expect(p.get('access_type')).toBe('offline');
    expect(p.get('prompt')).toBe('consent');
    expect(p.get('code_challenge')).toBe('ch');
    expect(p.get('code_challenge_method')).toBe('S256');
    expect(p.get('state')).toBe('st');
    expect(p.get('scope')).toContain('drive.readonly');
  });

  it('Dropbox requests offline access; OneDrive targets /consumers', () => {
    const dbx = new URL(buildAuthorizeUrl(DROPBOX_OAUTH, client, { state: 's' }));
    expect(dbx.searchParams.get('token_access_type')).toBe('offline');
    const ms = new URL(buildAuthorizeUrl(ONEDRIVE_OAUTH, client, { state: 's' }));
    expect(ms.pathname).toContain('/consumers/');
    expect(ms.searchParams.get('scope')).toContain('offline_access');
  });
});

function mockFetch(status: number, payload: unknown): FetchLike {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  });
}

describe('token exchange & refresh', () => {
  it('parses an access + refresh token from a code exchange', async () => {
    const fetchImpl = mockFetch(200, {
      access_token: 'at',
      refresh_token: 'rt',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'drive.readonly',
    });
    const t = await exchangeCode(
      GOOGLE_DRIVE_OAUTH,
      client,
      { code: 'c', codeVerifier: 'v' },
      fetchImpl,
    );
    expect(t.accessToken).toBe('at');
    expect(t.refreshToken).toBe('rt');
    expect(t.expiresInSec).toBe(3600);
  });

  it('refreshes an access token', async () => {
    const t = await refreshAccessToken(
      DROPBOX_OAUTH,
      client,
      'rt',
      mockFetch(200, { access_token: 'new', expires_in: 14400 }),
    );
    expect(t.accessToken).toBe('new');
    expect(t.expiresInSec).toBe(14400);
  });

  it('throws OAuthError on a failed token request', async () => {
    await expect(
      exchangeCode(
        GOOGLE_DRIVE_OAUTH,
        client,
        { code: 'c' },
        mockFetch(400, { error: 'invalid_grant' }),
      ),
    ).rejects.toBeInstanceOf(OAuthError);
  });

  it('exposes provider configs by key', () => {
    expect(getOAuthProvider('onedrive')?.tokenUrl).toContain('login.microsoftonline.com');
    expect(getOAuthProvider('nope')).toBeUndefined();
  });
});
