import { describe, expect, it } from 'vitest';
import { docPreviewKey, posterKey, thumbnailKey } from '../apps/web/lib/archive/derivative-utils';

describe('derivative storage keys', () => {
  it('thumbnail places the owner id as the 2nd path segment (storage RLS)', () => {
    const key = thumbnailKey('user-123', 'item-abc');
    expect(key).toBe('archive/user-123/thumb/item-abc.webp');
    // storage.foldername(name)[2] must equal the owner id (1-indexed in SQL).
    expect(key.split('/')[1]).toBe('user-123');
  });

  it('poster uses the same RLS-safe layout', () => {
    const key = posterKey('user-123', 'item-abc');
    expect(key).toBe('archive/user-123/poster/item-abc.webp');
    expect(key.split('/')[1]).toBe('user-123');
  });

  it('document preview uses the same RLS-safe layout', () => {
    const key = docPreviewKey('user-123', 'item-abc');
    expect(key).toBe('archive/user-123/docpreview/item-abc.webp');
    expect(key.split('/')[1]).toBe('user-123');
  });
});
