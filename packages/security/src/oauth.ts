import { createHash, randomBytes } from 'node:crypto';

/**
 * Standard OAuth 2.0 helpers (RFC 6749 + PKCE RFC 7636). Provider-agnostic and
 * used by every live connector: a random `state` for CSRF protection and a PKCE
 * `code_verifier`/`code_challenge` pair (S256). All values are URL-safe.
 */

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Cryptographically random URL-safe token (default 32 bytes). */
export function randomToken(bytes = 32): string {
  return base64url(randomBytes(bytes));
}

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

/** Generate a PKCE verifier + S256 challenge (RFC 7636). */
export function generatePkce(): PkcePair {
  const codeVerifier = base64url(randomBytes(32)); // 43 chars, within 43–128 range
  const codeChallenge = base64url(createHash('sha256').update(codeVerifier).digest());
  return { codeVerifier, codeChallenge, codeChallengeMethod: 'S256' };
}

/** Constant-time-ish equality for opaque tokens (state comparison). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
