import { describe, expect, it } from 'vitest';
import { rateLimit, clientIp } from '../apps/web/lib/security/rate-limit';

describe('rateLimit', () => {
  it('allows up to the limit then blocks within the window', () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('scopes independently per key', () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(rateLimit(a, 1, 60_000).ok).toBe(true);
    expect(rateLimit(a, 1, 60_000).ok).toBe(false);
    // b is untouched by a's usage.
    expect(rateLimit(b, 1, 60_000).ok).toBe(true);
  });
});

describe('clientIp', () => {
  it('takes the first x-forwarded-for entry', () => {
    const h = new Headers({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1' });
    expect(clientIp(h)).toBe('203.0.113.1');
  });

  it('falls back to x-real-ip then unknown', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.9' }))).toBe('198.51.100.9');
    expect(clientIp(new Headers())).toBe('unknown');
  });
});
