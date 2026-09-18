# Database

_Status: Phase 0 — schema is designed here but NOT yet migrated. Built in Phase 1._

All tables use UUID primary keys, `created_at`/`updated_at` timestamps, and
**Row Level Security enabled with default-deny** (CLAUDE.md §43). Every
user-owned table is scoped by `owner_id`/`user_id = auth.uid()` and covered by
RLS tests proving cross-user access is impossible.

## Planned tables (Phase 1)

### profiles
Application user profile linked to `auth.users`. A **person** (someone who
appears in memories / a future family member) is deliberately a _separate_ concept
from an application **user** (§37); the person model is added later.

### connector_registry
Persisted mirror of `@dla/connectors` capability data used for admin/reporting.
The application's source of truth remains the typed registry in code; this table
is for operational queries. Never advertises unverified providers as connectable.

### connector_accounts (§24)
`id, user_id, connector_key, provider_account_identifier, display_name, status,
connected_at, last_successful_archive_at, last_attempt_at, authorization_expires_at,
archive_frequency (daily|weekly|monthly, default daily), cursor_state_encrypted,
created_at, updated_at`. Provider credentials are **never** stored here as
plaintext — encrypted token storage is a separate, server-only concern (§45).

### archive_items (§21)
`id, owner_id, type (photo|video|document|post|message|audio|other),
original_filename, mime_type, file_size, checksum_sha256, created_at_source,
modified_at_source, archived_at, storage_provider, storage_key, metadata_json,
status (pending|storing|archived|failed), created_at, updated_at`.
Originals are immutable (§32). `status = archived` only after storage + metadata
are both confirmed (§72).

### archive_item_sources (§22)
`id, archive_item_id, connector_account_id, source_item_id, source_url_if_safe,
source_created_at, source_modified_at, source_deleted_at, metadata_json`.
Multiple sources may point to one physical item when the binary is identical
(dedup by `checksum_sha256`). `source_deleted_at` records that a source copy
disappeared — the archive item is retained (§4).

### archive_jobs (§26)
`id, user_id, connector_account_id, job_type
(discovery|initial_import|incremental_import|export|integrity_check),
status (queued|running|completed|failed|retrying|cancelled), scheduled_at,
started_at, completed_at, items_discovered, items_processed, items_archived,
items_skipped, items_failed, bytes_processed, retry_count, error_code,
safe_error_message, created_at, updated_at`. No sensitive content in error fields.

### security_audit_events (§47)
`id, user_id, type, context_json (non-sensitive only), occurred_at`. Never logs
private content, tokens or passwords.

## Deduplication

Exact SHA-256 binary match may deduplicate _storage_ while all source
relationships are retained (§23). Perceptual/AI similarity never triggers
automatic deletion.

## Type generation

After the initial migrations exist, `packages/database/src/index.ts` is replaced
by types generated from the live schema (`supabase gen types typescript`), giving
the app and packages end-to-end type safety.
