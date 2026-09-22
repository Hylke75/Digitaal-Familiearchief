import { describe, expect, it } from 'vitest';
import { sortAreas, toArea } from '../apps/web/lib/archive/document-areas';

describe('document life areas', () => {
  it('falls back to Overig for empty categories', () => {
    expect(toArea('')).toBe('Overig');
    expect(toArea(null)).toBe('Overig');
    expect(toArea('  Woning ')).toBe('Woning');
  });

  it('orders known areas first, unknown A→Z, Overig last', () => {
    expect(sortAreas(['Overig', 'Verzekeringen', 'Woning', 'Zomaar'])).toEqual([
      'Woning',
      'Verzekeringen',
      'Zomaar',
      'Overig',
    ]);
  });

  it('dedupes', () => {
    expect(sortAreas(['Woning', 'Woning', 'Geld'])).toEqual(['Woning', 'Geld']);
  });
});
