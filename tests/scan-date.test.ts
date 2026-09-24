import { describe, expect, it } from 'vitest';
import { scannedTakenAtIso } from '../apps/web/lib/archive/scan-date';

const maxYear = 2026;

describe('scannedTakenAtIso', () => {
  it('returns null for empty or non-4-digit input', () => {
    expect(scannedTakenAtIso('', maxYear)).toBeNull();
    expect(scannedTakenAtIso(null, maxYear)).toBeNull();
    expect(scannedTakenAtIso('  ', maxYear)).toBeNull();
    expect(scannedTakenAtIso('99', maxYear)).toBeNull();
    expect(scannedTakenAtIso('20260', maxYear)).toBeNull();
    expect(scannedTakenAtIso('jaar', maxYear)).toBeNull();
  });

  it('maps a plausible year to midday on 1 January', () => {
    expect(scannedTakenAtIso('1985', maxYear)).toBe('1985-01-01T12:00:00.000Z');
    expect(scannedTakenAtIso('2026', maxYear)).toBe('2026-01-01T12:00:00.000Z');
  });

  it('rejects years before photography and in the future', () => {
    expect(scannedTakenAtIso('1800', maxYear)).toBeNull();
    expect(scannedTakenAtIso('2027', maxYear)).toBeNull();
  });
});
