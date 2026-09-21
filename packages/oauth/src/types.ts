/**
 * @dla/oauth — provider-independent OAuth 2.0 authorization-code framework
 * (confidential web-server clients + PKCE). Verified against current official
 * provider docs (see docs/connectors/*.md). No side effects; `fetch` is injected
 * so it is fully unit-testable.
 */

export interface OAuthProviderConfig {
  key: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  /** PKCE S256 (defense-in-depth even for confidential clients). */
  usePkce: boolean;
  /** Provider-specific authorize params (e.g. Google access_type=offline). */
  extraAuthorizeParams?: Record<string, string>;
  /** Scope separator (space for most providers). */
  scopeSeparator?: string;
  /** Client-id parameter name (TikTok uses `client_key`). Defaults to `client_id`. */
  clientIdParam?: string;
}

export interface OAuthClient {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  /** Seconds until the access token expires. */
  expiresInSec?: number;
  scope?: string;
  tokenType?: string;
  raw: Record<string, unknown>;
}

export class OAuthError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>;
