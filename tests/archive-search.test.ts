import { describe, expect, it } from 'vitest';
import { escapeLike } from '../apps/web/lib/archive/search-utils';

describe('archive search escaping', () => {
  it('escapes ilike wildcards so queries stay literal', () => {
    expect(escapeLike('100%_done')).toBe('100\\%\\_done');
  });

  it('escapes commas and parentheses (PostgREST filter metachars)', () => {
    expect(escapeLike('foto (1), kopie')).toBe('foto \\(1\\)\\, kopie');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeLike('vakantie 2024')).toBe('vakantie 2024');
  });
});
