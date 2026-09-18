# Storage

_Status: Phase 0 — abstraction + in-memory reference implementation. The Supabase
Storage adapter lands in Phase 5._

## The abstraction (CLAUDE.md §9)

Archive business logic depends only on the `ArchiveStorageProvider` interface
(`packages/storage`), never on Supabase Storage or any other backend directly.
This lets us move to European S3-compatible object storage — or petabyte-scale
systems — without rewriting the archive domain.

```
interface ArchiveStorageProvider {
  id: string
  put(key, data, { contentType, checksumSha256 }): StoredObjectMetadata
  get(key): Uint8Array
  stream(key): AsyncIterable<Uint8Array>
  exists(key): boolean
  delete(key): void
  getMetadata(key): StoredObjectMetadata
  createSignedAccess(key, ttlSeconds): { url, expiresAt }
  verifyIntegrity(key, expectedSha256): boolean
}
```

## Design rules

- **Originals are immutable** (§32): `put` writes once at a content-addressed key.
  There is deliberately no overwrite operation. Re-`put` of identical bytes is a
  no-op (idempotent), which supports safe retries and dedup.
- **Never falsely successful** (§72): `put` verifies the SHA-256 of the stored
  bytes against the expected checksum before returning success. A mismatch throws.
- **Content addressing**: keys are derived from `owner_id + checksum_sha256`
  (`@dla/archive#contentStorageKey`), so identical content deduplicates storage
  while source relationships are retained separately (§22, §23).
- **Signed access is short-lived** (§42): `createSignedAccess` returns a URL with
  an explicit expiry; the archive browser never loads full-resolution originals
  unnecessarily (§31).
- **Integrity is verifiable** (§68): `verifyIntegrity` recomputes and compares the
  checksum, enabling periodic corruption checks. No destructive auto-repair
  without a verified second copy.

## Implementations

- `InMemoryStorageProvider` (Phase 0): reference implementation for testing the
  archive engine and connectors without any external backend. Not for production.
- Supabase Storage adapter (Phase 5): first production adapter.
- EU S3-compatible adapter (future): drop-in replacement for scale.
