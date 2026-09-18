import { describe, expect, it } from 'vitest';
import { contentStorageKey, sha256Hex } from './checksum';

const bytes = (s: string) => new TextEncoder().encode(s);

describe('@dla/archive checksum', () => {
  it('produces the known SHA-256 of "abc"', () => {
    expect(sha256Hex(bytes('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('derives a deterministic, owner-scoped storage key', () => {
    const sum = sha256Hex(bytes('photo'));
    const key = contentStorageKey('user-1', sum);
    expect(key).toBe(`archive/user-1/${sum.slice(0, 2)}/${sum}`);
    // Same owner + same bytes → same key (enables idempotent dedup).
    expect(contentStorageKey('user-1', sum)).toBe(key);
  });
});
