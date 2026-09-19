import {
  OAuthError,
  type FetchLike,
  type OAuthClient,
  type OAuthProviderConfig,
  type TokenSet,
} from './types';

/** Build the provider authorization URL (step 1 of the code flow). */
export function buildAuthorizeUrl(
  cfg: OAuthProviderConfig,
  client: OAuthClient,
  opts: { state: string; codeChallenge?: string },
): string {
  const sep = cfg.scopeSeparator ?? ' ';
  const params = new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: client.redirectUri,
    response_type: 'code',
    scope: cfg.scopes.join(sep),
    state: opts.state,
    ...(cfg.extraAuthorizeParams ?? {}),
  });
  if (cfg.usePkce && opts.codeChallenge) {
    params.set('code_challenge', opts.codeChallenge);
    params.set('code_challenge_method', 'S256');
  }
  return `${cfg.authorizeUrl}?${params.toString()}`;
}

function parseTokenResponse(data: Record<string, unknown>): TokenSet {
  return {
    accessToken: String(data.access_token ?? ''),
    refreshToken: data.refresh_token ? String(data.refresh_token) : undefined,
    expiresInSec: typeof data.expires_in === 'number' ? data.expires_in : undefined,
    scope: data.scope ? String(data.scope) : undefined,
    tokenType: data.token_type ? String(data.token_type) : undefined,
    raw: data,
  };
}

async function tokenRequest(
  cfg: OAuthProviderConfig,
  body: URLSearchParams,
  fetchImpl: FetchLike,
): Promise<TokenSet> {
  const res = await fetchImpl(cfg.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new OAuthError(`Token request failed (${res.status})`, res.status, text);
  }
  const data = (await res.json()) as Record<string, unknown>;
  return parseTokenResponse(data);
}

/** Exchange an authorization code for tokens (step 2). Returns the refresh token. */
export function exchangeCode(
  cfg: OAuthProviderConfig,
  client: OAuthClient,
  opts: { code: string; codeVerifier?: string },
  fetchImpl: FetchLike,
): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: opts.code,
    redirect_uri: client.redirectUri,
    client_id: client.clientId,
    client_secret: client.clientSecret,
  });
  if (cfg.usePkce && opts.codeVerifier) body.set('code_verifier', opts.codeVerifier);
  return tokenRequest(cfg, body, fetchImpl);
}

/** Exchange a refresh token for a fresh access token. */
export function refreshAccessToken(
  cfg: OAuthProviderConfig,
  client: OAuthClient,
  refreshToken: string,
  fetchImpl: FetchLike,
): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: client.clientId,
    client_secret: client.clientSecret,
  });
  return tokenRequest(cfg, body, fetchImpl);
}
