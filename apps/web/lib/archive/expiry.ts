/**
 * Pure expiry helper (no I/O, unit-tested). A document that warns you before it
 * lapses is the reason to open a document archive more than once a year (design
 * advice, Advice B). "Soon" is the 30 days before the expiry date.
 */
export type ExpiryStatus = 'expired' | 'soon' | 'ok';

const SOON_MS = 30 * 24 * 60 * 60 * 1000;

export function expiryStatus(expiresAt: string | null, nowMs: number): ExpiryStatus | null {
  if (!expiresAt) return null;
  const t = Date.parse(expiresAt);
  if (Number.isNaN(t)) return null;
  if (t < nowMs) return 'expired';
  if (t - nowMs <= SOON_MS) return 'soon';
  return 'ok';
}
