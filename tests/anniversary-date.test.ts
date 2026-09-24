import { describe, expect, it } from 'vitest';
import { anniversaryYearsAgo } from '../apps/web/lib/archive/anniversary-date';

const today = { year: 2026, month: 9, day: 18 };

describe('anniversaryYearsAgo', () => {
  it('returns null for empty or malformed dates', () => {
    expect(anniversaryYearsAgo(null, today)).toBeNull();
    expect(anniversaryYearsAgo(undefined, today)).toBeNull();
    expect(anniversaryYearsAgo('2020', today)).toBeNull();
  });

  it('counts whole years back for the same month and day', () => {
    expect(anniversaryYearsAgo('2020-09-18', today)).toBe(6);
    expect(anniversaryYearsAgo('2025-09-18T12:00:00Z', today)).toBe(1);
  });

  it('ignores other days', () => {
    expect(anniversaryYearsAgo('2020-09-17', today)).toBeNull();
    expect(anniversaryYearsAgo('2020-10-18', today)).toBeNull();
  });

  it('ignores the same year and future years (not an anniversary yet)', () => {
    expect(anniversaryYearsAgo('2026-09-18', today)).toBeNull();
    expect(anniversaryYearsAgo('2027-09-18', today)).toBeNull();
  });

  it('matches a 29 February memory only when today is 29 February', () => {
    const leap = { year: 2028, month: 2, day: 29 };
    expect(anniversaryYearsAgo('2020-02-29', leap)).toBe(8);
    expect(anniversaryYearsAgo('2020-02-29', { year: 2027, month: 2, day: 28 })).toBeNull();
  });
});
