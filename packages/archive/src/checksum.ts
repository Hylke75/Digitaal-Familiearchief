import { createHash } from 'node:crypto';

/**
 * SHA-256 content addressing — the basis for both integrity verification
 * (CLAUDE.md §68) and exact-binary deduplication (CLAUDE.md §23).
 */
export function sha256Hex(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Deterministic storage key for an owner's content. Identical bytes for the
 * same owner produce the same key, which makes `put` idempotent and lets exact
 * duplicates deduplicate storage while their source relationships are retained.
 */
export function contentStorageKey(ownerId: string, checksumSha256: string): string {
  return `archive/${ownerId}/${checksumSha256.slice(0, 2)}/${checksumSha256}`;
}
