import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Destination-OAuth token primitives (docs/connectors/meta-eyi.md §7–§9). Bewora
 * is the OAuth provider Meta authenticates against. Tokens/codes are opaque,
 * cryptographically random, and stored only as SHA-256 hashes (never raw), so a
 * DB leak cannot reveal usable credentials. Codes are short-lived + single-use;
 * refresh tokens rotate. This module holds only the crypto/expiry helpers — the
 * lifecycle + persistence live in the OAuth routes.
 */

export const AUTH_CODE_TTL_MS = 60_000; // 60s, single-use
export const ACCESS_TOKEN_TTL_MS = 3_600_000; // 1h
export const REFRESH_TOKEN_TTL_MS = 3 * 365 * 24 * 3_600_000; // up to the 3-year recurring window

/** A cryptographically secure, URL-safe opaque token. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Store only this hash — never the raw token. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Constant-time comparison of a presented token against a stored hash. */
export function verifyToken(presented: string, storedHash: string): boolean {
  const a = Buffer.from(hashToken(presented), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export function expiryFrom(ttlMs: number, now: number = Date.now()): string {
  return new Date(now + ttlMs).toISOString();
}

export function isExpired(expiresAtIso: string, now: number = Date.now()): boolean {
  return new Date(expiresAtIso).getTime() <= now;
}

/** Exact redirect-URI match (no prefix/substring matching) — §9. */
export function redirectUriMatches(presented: string, allowed: readonly string[]): boolean {
  return allowed.includes(presented);
}
