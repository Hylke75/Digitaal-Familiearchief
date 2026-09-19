import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  type ArchiveStorageProvider,
  type PutOptions,
  type SignedAccess,
  type StoredObjectMetadata,
  ChecksumMismatchError,
  StorageKeyNotFoundError,
} from '@dla/storage';

const BUCKET = 'archief';

function sha256Hex(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Supabase Storage implementation of {@link ArchiveStorageProvider} (the first
 * production adapter, CLAUDE.md §9). Objects live in a private bucket under the
 * owner's uid folder; storage RLS enforces per-user isolation. The archive
 * domain depends only on the interface, so this backend is replaceable.
 */
export class SupabaseStorageProvider implements ArchiveStorageProvider {
  readonly id = 'supabase';

  constructor(private readonly supabase: SupabaseClient) {}

  async put(key: string, data: Uint8Array, options: PutOptions): Promise<StoredObjectMetadata> {
    // Guard: never report success for content that does not match its checksum.
    if (sha256Hex(data) !== options.checksumSha256) {
      throw new ChecksumMismatchError(key);
    }
    const { error } = await this.supabase.storage.from(BUCKET).upload(key, data, {
      contentType: options.contentType,
      upsert: true, // content-addressed key → identical bytes, idempotent
    });
    if (error) throw error;
    return {
      key,
      size: data.byteLength,
      contentType: options.contentType,
      checksumSha256: options.checksumSha256,
      createdAt: new Date().toISOString(),
    };
  }

  async get(key: string): Promise<Uint8Array> {
    const { data, error } = await this.supabase.storage.from(BUCKET).download(key);
    if (error || !data) throw new StorageKeyNotFoundError(key);
    return new Uint8Array(await data.arrayBuffer());
  }

  async *stream(key: string): AsyncIterable<Uint8Array> {
    yield await this.get(key);
  }

  async exists(key: string): Promise<boolean> {
    const { error } = await this.supabase.storage.from(BUCKET).createSignedUrl(key, 30);
    return !error;
  }

  async delete(key: string): Promise<void> {
    await this.supabase.storage.from(BUCKET).remove([key]);
  }

  async getMetadata(key: string): Promise<StoredObjectMetadata> {
    const bytes = await this.get(key);
    return {
      key,
      size: bytes.byteLength,
      contentType: 'application/octet-stream',
      checksumSha256: sha256Hex(bytes),
      createdAt: new Date().toISOString(),
    };
  }

  async createSignedAccess(key: string, ttlSeconds: number): Promise<SignedAccess> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET)
      .createSignedUrl(key, ttlSeconds);
    if (error || !data) throw new StorageKeyNotFoundError(key);
    return {
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };
  }

  async verifyIntegrity(key: string, expectedSha256: string): Promise<boolean> {
    const bytes = await this.get(key);
    return sha256Hex(bytes) === expectedSha256;
  }
}
