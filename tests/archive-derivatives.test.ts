import { describe, expect, it } from 'vitest';
import { thumbnailKey } from '../apps/web/lib/archive/derivative-utils';

describe('thumbnail storage key', () => {
  it('places the owner id as the 2nd path segment (storage RLS)', () => {
    const key = thumbnailKey('user-123', 'item-abc');
    expect(key).toBe('archive/user-123/thumb/item-abc.webp');
    // storage.foldername(name)[2] must equal the owner id (1-indexed in SQL).
    expect(key.split('/')[1]).toBe('user-123');
  });
});
