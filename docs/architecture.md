# Architecture

_Status: Phase 0 (foundation). Last updated: 2026-09-18._

## 1. Product understanding

The Digital Life Archive is a **consumer product that preserves someone's digital
life independently of the platforms it currently lives on**. The promise: connect
your sources once, we archive the existing history and then keep preserving new
content automatically, and the archive can eventually be passed to people you
choose.

Four functions define the product: **COLLECT → PRESERVE → ORGANISE → PASS ON.**

It is explicitly _not_ "another cloud drive". The differentiators are continuity,
simplicity, independence, portability and trust (CLAUDE.md §71). The consumer
never needs technical knowledge and never sees technical terminology (§3).

### Non-negotiable product invariants

These shape every technical decision and are encoded as tests where possible:

1. **Source deletion never deletes the archive** (§4). Losing the original on
   Instagram/Drive/etc. must never remove the archived copy.
2. **Existing history first** (§5): on connect we discover and archive the whole
   accessible past before continuous archiving.
3. **Trust over optimism** (§72): an item is only shown as safe once durable
   storage _and_ database metadata are both confirmed. Until then: "Bezig met
   veiligstellen".
4. **Honest capabilities** (§15): a connector is never offered as connectable
   unless a real, verified automatic connector exists.
5. **Idempotent archiving** (§6): retrying a job never creates duplicates.
6. **Privacy & security by design** (§42–§48): RLS default-deny, service-role
   server-only, encrypted provider tokens, audit logging, EU processing.

## 2. Technology & repository shape

- **Monorepo** managed with **pnpm workspaces** (`apps/*`, `packages/*`).
- **Frontend/app**: Next.js 14 (App Router), React 18, TypeScript (strict),
  Tailwind CSS. Localisation via `next-intl` fed from `@dla/i18n`.
- **Backend/data**: Supabase (PostgreSQL, Auth, RLS, Storage, Edge Functions).
- **CI**: GitHub Actions (format, lint, typecheck, test, build, dependency audit).

```
apps/
  web/                 Next.js consumer app (the only runtime today)
  mobile-placeholder/  reserved slot; no app built yet (§10)
packages/
  shared/     cross-cutting types + pure utils (Result, ids, formatBytes)
  i18n/       locales + nl/en dictionaries (single source of truth for copy)
  database/   generated DB types (placeholder in Phase 0)
  storage/    ArchiveStorageProvider abstraction + in-memory reference impl
  connectors/ ArchiveConnector interface + honest capability registry
  archive/    provider-independent domain model + checksum/dedup helpers
  security/   audit event types, token-encryption interface, log redaction
  ui/         shared UI helpers (grows in later phases)
supabase/     config, migrations, functions, seed
docs/         architecture, database, connectors, security, privacy, storage, decisions, api
tests/        synthetic fixtures only (§56)
```

### Why a monorepo with a storage/connector split

The archive domain must not depend on Supabase specifics or on any single
provider. Packages enforce that boundary at compile time:

- Archive logic depends on `ArchiveStorageProvider` (an interface), never on
  Supabase Storage directly → storage backend is replaceable (§9).
- Archive logic depends on `ArchiveConnector` (an interface) and a capability
  registry, never on Google/Meta specifics → providers are pluggable, and the
  UI is generated from declared capabilities (§15, §17).

## 3. Runtime & security boundaries

- **Browser** uses only the Supabase publishable/anon key. RLS is the security
  boundary, never frontend filtering (§43).
- **Server** (Server Components, Route Handlers, Edge Functions) holds any
  privileged logic. The **service-role key is server-only** and never enters the
  browser bundle (§44). `apps/web/lib/env.ts` validates public vs. server config
  in separate schemas to make this boundary explicit and fail-fast (§12).
- **Provider tokens** are encrypted at rest via the `TokenEncryption` interface;
  never logged, never plaintext (§45). `redactSecrets()` keeps secrets out of logs.
- **Scheduling is backend-controlled** (§25): archiving continues while the
  browser is closed. Jobs must not depend on a single web process (§69).

## 4. Data model (built in Phase 1)

Core tables (see `docs/database.md`): `profiles`, `connector_accounts`,
`archive_items`, `archive_item_sources`, `archive_jobs`, `security_audit_events`,
and the connector capability registry. Content addressing is **SHA-256**, which
powers both integrity verification (§68) and exact-binary deduplication (§23)
while all source relationships are preserved (§22).

## 5. Identified architectural risks & assumptions

| # | Risk / assumption | Mitigation / status |
|---|---|---|
| R1 | **External connector capabilities are unverified.** Google Drive/Photos, Meta, TikTok APIs change and impose restricted-scope/commercial-backup limits. | Registry marks every external provider `research`; Phase 9 requires documented verification before any `verified`/`production`. No fake OAuth possible. |
| R2 | **Storage cost/scale** could reach TB–PB. Supabase Storage is a starting point, not the endgame. | `ArchiveStorageProvider` abstraction; migrate to EU S3-compatible storage without touching the domain (§9). |
| R3 | **Legal/privacy exposure** (GDPR, digital legacy, provider ToS). | Privacy-by-design, EU region (eu-central-1), audit log, no ToS workarounds (§48, §74). Legacy is architecture-only in MVP (§38–§39). |
| R4 | **"Never falsely safe"** is easy to violate with optimistic UX. | Status model separates `pending/storing/archived`; storage verifies checksum before success; tests assert no false success. |
| R5 | **Idempotency** under retries/duplicate schedulers. | Deterministic content storage keys; idempotent `put`; jobs designed for at-least-once execution (hardened in Phase 6). |
| R6 | **Token security.** A leaked refresh token compromises a user's provider account. | Encrypted at rest, server-only, rotating scheme tag, never logged (§45). |
| R7 | **Vendor lock-in of our own product.** | Full-export architecture keeps originals + portable metadata; no proprietary format (§40, §73). |

## 6. What Phase 0 deliberately does NOT do

No product features (auth, onboarding, connectors, engine) are implemented yet —
only the foundation, interfaces, tooling, CI and docs. See `docs/decisions.md`
for the record of choices and `CLAUDE.md` §63 for the phase plan. **Phase 1 does
not begin until explicitly instructed.**
