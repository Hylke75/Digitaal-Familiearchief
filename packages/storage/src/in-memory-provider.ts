import { createHash } from 'node:crypto';
import {
  type ArchiveStorageProvider,
  type PutOptions,
  type SignedAccess,
  type StoredObjectMetadata,
  ChecksumMismatchError,
  StorageKeyNotFoundError,
} from './index';

interface StoredObject {
  data: Uint8Array;
  metadata: StoredObjectMetadata;
}

function sha256Hex(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Reference in-memory implementation of {@link ArchiveStorageProvider}.
 *
 * Purpose: let the archive engine (Phase 5) and connectors (Phase 4) be tested
 * end-to-end without any external backend. NOT for production use.
 */
export class InMemoryStorageProvider implements ArchiveStorageProvider {
  readonly id = 'memory';
  private readonly objects = new Map<string, StoredObject>();

  async put(key: string, data: Uint8Array, options: PutOptions): Promise<StoredObjectMetadata> {
    const actual = sha256Hex(data);
    if (actual !== options.checksumSha256) {
      throw new ChecksumMismatchError(key);
    }
    const metadata: StoredObjectMetadata = {
      key,
      size: data.byteLength,
      contentType: options.contentType,
      checksumSha256: actual,
      createdAt: new Date().toISOString(),
    };
    // Originals are immutable: writing identical content at the same key is a
    // no-op that returns the existing metadata rather than mutating anything.
    const existing = this.objects.get(key);
    if (existing && existing.metadata.checksumSha256 === actual) {
      return existing.metadata;
    }
    this.objects.set(key, { data, metadata });
    return metadata;
  }

  async get(key: string): Promise<Uint8Array> {
    const obj = this.objects.get(key);
    if (!obj) throw new StorageKeyNotFoundError(key);
    return obj.data;
  }

  async *stream(key: string): AsyncIterable<Uint8Array> {
    yield await this.get(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.objects.has(key);
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }

  async getMetadata(key: string): Promise<StoredObjectMetadata> {
    const obj = this.objects.get(key);
    if (!obj) throw new StorageKeyNotFoundError(key);
    return obj.metadata;
  }

  async createSignedAccess(key: string, ttlSeconds: number): Promise<SignedAccess> {
    if (!this.objects.has(key)) throw new StorageKeyNotFoundError(key);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    return { url: `memory://${key}?token=test`, expiresAt };
  }

  async verifyIntegrity(key: string, expectedSha256: string): Promise<boolean> {
    const obj = this.objects.get(key);
    if (!obj) throw new StorageKeyNotFoundError(key);
    return sha256Hex(obj.data) === expectedSha256;
  }
}
