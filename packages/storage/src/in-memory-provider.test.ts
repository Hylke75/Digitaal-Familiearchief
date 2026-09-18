import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { InMemoryStorageProvider } from './in-memory-provider';
import { ChecksumMismatchError, StorageKeyNotFoundError } from './index';

const bytes = (s: string) => new TextEncoder().encode(s);
const sha = (u: Uint8Array) => createHash('sha256').update(u).digest('hex');

describe('InMemoryStorageProvider', () => {
  it('stores and retrieves content with a verified checksum', async () => {
    const store = new InMemoryStorageProvider();
    const data = bytes('a memory');
    const meta = await store.put('k1', data, {
      contentType: 'text/plain',
      checksumSha256: sha(data),
    });
    expect(meta.size).toBe(data.byteLength);
    expect(await store.get('k1')).toEqual(data);
    expect(await store.verifyIntegrity('k1', sha(data))).toBe(true);
  });

  it('rejects a checksum mismatch (never reports false success)', async () => {
    const store = new InMemoryStorageProvider();
    await expect(
      store.put('k2', bytes('x'), { contentType: 'text/plain', checksumSha256: 'deadbeef' }),
    ).rejects.toBeInstanceOf(ChecksumMismatchError);
    expect(await store.exists('k2')).toBe(false);
  });

  it('re-putting identical content is idempotent', async () => {
    const store = new InMemoryStorageProvider();
    const data = bytes('same');
    const opts = { contentType: 'text/plain', checksumSha256: sha(data) };
    const a = await store.put('k3', data, opts);
    const b = await store.put('k3', data, opts);
    expect(a.createdAt).toBe(b.createdAt);
  });

  it('throws on unknown keys', async () => {
    const store = new InMemoryStorageProvider();
    await expect(store.get('missing')).rejects.toBeInstanceOf(StorageKeyNotFoundError);
  });
});
