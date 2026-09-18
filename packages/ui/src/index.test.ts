import { describe, expect, it } from 'vitest';
import { cn } from './index';

describe('@dla/ui cn', () => {
  it('joins truthy class parts', () => {
    expect(cn('a', false, undefined, 'b', null, 'c')).toBe('a b c');
  });
});
