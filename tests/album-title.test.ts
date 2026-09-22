import { describe, expect, it } from 'vitest';
import { normalizeTitle } from '../apps/web/lib/archive/album-utils';

describe('album title normalisation', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeTitle('  Zomer   2024 ')).toBe('Zomer 2024');
  });

  it('returns null for empty/whitespace titles', () => {
    expect(normalizeTitle('')).toBeNull();
    expect(normalizeTitle('   ')).toBeNull();
  });

  it('bounds the length', () => {
    expect(normalizeTitle('x'.repeat(200), 10)).toHaveLength(10);
  });
});
