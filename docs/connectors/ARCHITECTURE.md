# Live connector & background-archiving architecture

_Decision record, 2026-09-19. Based on verified research of current official
provider + platform docs (see per-provider docs + source links inline). This is
the "best solution" for THIS stack (Next.js 14 on Vercel Pro + Supabase, EU,
reuse existing Node/TS archive engine, minimal vendors)._

## 1. Background job engine — DECISION

**Postgres `SKIP LOCKED` work queue with per-file rows, driven by a Vercel Cron
Node route handler (`maxDuration=800`), with `pg_cron` + `pg_net` as a redundant
scheduler.** Chosen over Supabase Edge (Deno port + 256 MB/2s CPU is hostile to
streaming large files) and over managed durable-workflow services (Inngest is
US-only; Trigger.dev keeps control data in us-east-1; QStash is EU-clean but only
re-calls the same Vercel functions — no gain, +1 vendor).

Why it wins here: it **reuses the existing Node/TS archive engine unchanged**,
keeps **all data in Supabase (EU)**, adds **zero vendors**, costs nothing beyond
current plans, and gives full control over resumability, idempotency and the
critical **outage-vs-deletion** distinction.

Key numbers (verified): Vercel Pro function `maxDuration` 800s GA; Vercel Cron
delivery is best-effort (no retries) → `pg_cron` is the reliable heartbeat.
Supabase Edge Functions: 400s wall but 2s CPU / 256 MB → dispatcher only, not the
heavy lifting.

### Model
- **`archive_jobs`** — one row per run of a connected account (full | incremental),
  with `run_at`, lease fields, `cursor` (provider discovery pagination), `next_archive_at`.
- **`archive_job_items`** — one row per file = the unit of **resumability AND
  idempotency** (`unique(job_id, source_item_id)`). A "batch" is just `LIMIT n` of
  eligible items; a crash at item 40,000 re-selects only non-`done` rows.
- **`claim_job_items`** RPC — `FOR UPDATE SKIP LOCKED` + a 10-min lease to reclaim
  crashed workers; concurrent workers grab disjoint rows without blocking.
- **Discovery** seeds items with `ON CONFLICT DO NOTHING` (re-running is safe).
- **Worker** (`/api/archive/tick`, Node, `maxDuration=800`): claim due jobs →
  claim item batches → stream provider→Supabase Storage → mark done in the same
  step. Stops ~20s before the wall; the next tick resumes. Runs under the
  **service role** (no user session in cron).
- **Scheduler** (`pg_cron`, every minute): promote incremental jobs whose
  `next_archive_at` elapsed; `pg_net` POST to the worker. A Vercel Cron hits the
  same endpoint as a redundant trigger. Both are idempotent → overlap is harmless.

### Failure classification (the most important rule)
Only a **per-file, distinct, authoritative 404 while the provider is otherwise
healthy** counts as a source deletion (→ soft tombstone, reconciled only after N
healthy passes). **429 / 5xx / timeout / network = transient** → retry with
`Retry-After`-aware exponential backoff + full jitter (dead-letter after ~6
attempts). **Batch-level circuit breaker**: if a batch fails en masse with one
error class, treat as outage — pause the job, back off, never tombstone. This
enforces CLAUDE.md §4 / CONNECTORS_BUILD.md §8/§37 at the engine level.

## 2. OAuth — DECISION

Provider-independent OAuth 2.0 **authorization-code** framework (`@dla/oauth`),
confidential web-server clients (client secret held server-side), **PKCE (S256)**
as defense-in-depth (Microsoft now recommends it for confidential clients too),
random `state` for CSRF. State + PKCE verifier ride in a short-lived **httpOnly,
signed cookie** between `/auth/[provider]/start` and `/auth/[provider]/callback`
(no DB table needed; serverless-safe).

Refresh tokens are stored **encrypted at rest** (AES-256-GCM, `@dla/security`
`ProviderCredentialStore`) in a `connector_credentials` table, written via a
`SECURITY DEFINER` RPC bound to `auth.uid()`. Only the background worker
(service role) decrypts them. App code never reads raw token columns.

### Per-provider specifics (verified — see docs/connectors/*.md)
- **Google Drive**: `access_type=offline` + `prompt=consent`; scope
  `drive.readonly` (restricted → verification + CASA) for full archival —
  `drive.file` is NOT equivalent. **Publish to production or refresh tokens die
  after 7 days in "Testing".** Full crawl `files.list`; incremental **Changes
  API** (`getStartPageToken`/`changes.list`, persist `newStartPageToken`); poll on
  cron > webhooks. Download blobs `alt=media` (Range-chunkable); native Docs via
  `files.export` (≤10 MB, Office/PDF map).
- **OneDrive (Graph)**: personal accounts, `/consumers` authority, `Files.Read
  offline_access User.Read openid`. **Refresh token rotates every use — persist
  the new one.** Full + incremental via **`/me/drive/root/delta`** (persist
  `@odata.deltaLink`; **410 Gone → full resync**). Track by `id`, `cTag` for
  content change. Download `/items/{id}/content` (302) or `@microsoft.graph.downloadUrl`.
- **Dropbox**: `token_access_type=offline`; scopes `files.metadata.read
  files.content.read account_info.read`. Full + incremental via `list_folder`
  (`path:""`, recursive) + `continue` cursor (409 `reset` → re-list). Webhooks
  (HMAC-SHA256 raw body) trigger cursor reconciliation. Download on
  `content.dropboxapi.com` with `Dropbox-API-Arg` (`id:` identity). `content_hash`
  (4 MB-block SHA-256) enables skip-download dedup.

## 3. Identity & dedup
Provider **stable id** (Drive fileId / Graph item id / Dropbox `id:`) is the source
identity (never path). Content identity remains **SHA-256** of the bytes
(`archive_items.checksum_sha256`), enabling cross-provider dedup and integrity
(existing engine). Where a provider exposes a reliable content hash
(Drive `md5Checksum`, Dropbox `content_hash`, Graph `cTag`), use it to decide
**whether to re-download** before fetching bytes.

## 4. Build order
1. `@dla/oauth` framework + provider configs + token exchange/refresh (unit-tested). ✅ this round
2. DB migration: job queue + `connector_credentials` + RPCs; regenerate types. ✅ this round
3. OAuth routes `/auth/[provider]/{start,callback}` + credential storage + create
   connector_account + enqueue initial job.
4. Live connector implementations (Google Drive → OneDrive → Dropbox) behind the
   existing `ArchiveConnector` contract, extended for paged discovery + changes.
5. Worker `/api/archive/tick` + `pg_cron` scheduler + Vercel Cron.
6. Provider mocks + contract tests (CI needs no live credentials).

## 5. Owner prerequisites (blocking production, not the build)
- Provider app registrations + client secrets (see `docs/PROVIDER_SETUP.md`).
- `SUPABASE_SERVICE_ROLE_KEY` (worker only, server-side) + `TOKEN_ENCRYPTION_KEY`
  in Vercel. Google restricted-scope verification + CASA for full Drive.
