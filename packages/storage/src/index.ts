/**
 * @dla/storage — the storage abstraction required by CLAUDE.md §9.
 *
 * Archive business logic MUST depend only on `ArchiveStorageProvider`, never on
 * Supabase Storage (or any other backend) directly. This lets us move from
 * Supabase Storage to European S3-compatible object storage — or petabyte-scale
 * systems — without rewriting the archive domain.
 *
 * Originals are immutable (CLAUDE.md §32): `put` writes once at a content key;
 * there is deliberately no "overwrite" operation.
 */

export interface StoredObjectMetadata {
  /** Opaque storage key; the archive domain treats this as a handle. */
  key: string;
  size: number;
  contentType: string;
  /** Hex-encoded SHA-256 of the stored bytes; enables integrity verification. */
  checksumSha256: string;
  createdAt: string;
}

export interface SignedAccess {
  url: string;
  /** Absolute expiry (ISO 8601). Signed URLs must be short-lived (CLAUDE.md §42). */
  expiresAt: string;
}

export interface PutOptions {
  contentType: string;
  /** Expected SHA-256; the provider verifies the stored bytes match. */
  checksumSha256: string;
}

export interface StorageProviderInfo {
  /** Stable identifier persisted on archive_items.storage_provider. */
  id: string;
}

/**
 * Durable object storage for archive originals and derived assets.
 * Every method is async and side-effect explicit. Implementations must be
 * idempotent where the spec requires it (re-`put` of identical content is safe).
 */
export interface ArchiveStorageProvider extends StorageProviderInfo {
  put(key: string, data: Uint8Array, options: PutOptions): Promise<StoredObjectMetadata>;
  get(key: string): Promise<Uint8Array>;
  stream(key: string): AsyncIterable<Uint8Array>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  getMetadata(key: string): Promise<StoredObjectMetadata>;
  createSignedAccess(key: string, ttlSeconds: number): Promise<SignedAccess>;
  /** Recompute the stored checksum and compare against the expected value. */
  verifyIntegrity(key: string, expectedSha256: string): Promise<boolean>;
}

export class StorageKeyNotFoundError extends Error {
  constructor(key: string) {
    super(`Storage key not found: ${key}`);
    this.name = 'StorageKeyNotFoundError';
  }
}

export class ChecksumMismatchError extends Error {
  constructor(key: string) {
    super(`Checksum mismatch for storage key: ${key}`);
    this.name = 'ChecksumMismatchError';
  }
}

export { InMemoryStorageProvider } from './in-memory-provider';
