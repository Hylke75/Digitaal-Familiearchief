import { describe, expect, it } from 'vitest';
import { expiryStatus } from '../apps/web/lib/archive/expiry';

const now = Date.parse('2026-09-23T00:00:00Z');

describe('document expiry status', () => {
  it('is null without a date or with a bad date', () => {
    expect(expiryStatus(null, now)).toBeNull();
    expect(expiryStatus('not-a-date', now)).toBeNull();
  });

  it('flags past dates as expired', () => {
    expect(expiryStatus('2026-09-22', now)).toBe('expired');
  });

  it('flags dates within 30 days as soon', () => {
    expect(expiryStatus('2026-10-10', now)).toBe('soon');
  });

  it('leaves far-off dates ok', () => {
    expect(expiryStatus('2027-06-01', now)).toBe('ok');
  });
});
