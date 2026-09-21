import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { generatePkce, randomToken, safeEqual } from './oauth';

const b64url = (b: Buffer) =>
  b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('oauth helpers', () => {
  it('generates a valid PKCE S256 pair', () => {
    const { codeVerifier, codeChallenge, codeChallengeMethod } = generatePkce();
    expect(codeChallengeMethod).toBe('S256');
    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(codeVerifier).toMatch(/^[A-Za-z0-9\-_]+$/);
    // Challenge must equal base64url(sha256(verifier)).
    expect(codeChallenge).toBe(b64url(createHash('sha256').update(codeVerifier).digest()));
  });

  it('produces unique url-safe random tokens', () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it('compares tokens safely', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'ab')).toBe(false);
  });
});
