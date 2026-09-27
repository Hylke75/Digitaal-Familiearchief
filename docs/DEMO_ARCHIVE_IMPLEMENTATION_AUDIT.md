# Demo Archive — Implementation Audit

Date: 2026-09-22
Status: Pre-implementation audit for the complete Bewora demo archive experience.
Scope: `apps/web`, `packages/*`, `supabase/migrations`, `data/demo`, `scripts/demo`.

This document satisfies §0 of the demo build specification. It records what
already exists, what can be reused, what must be added, migration/data-loss
risk, and the implementation plan. Implementation continues automatically after
this audit (the spec forbids stopping here).

---

## 1. What already exists

### Repository & tooling

- pnpm monorepo (`pnpm@9.12.0`, Node ≥20.11). Workspaces: `apps/*`, `packages/*`.
- `apps/web` — Next.js 14.2.35 App Router, React 18, TypeScript, Tailwind, `next-intl`.
- Packages: `@dla/{archive,connectors,database,i18n,import,oauth,security,shared,storage,ui}`.
- Path aliases (`tsconfig.base.json`): `@dla/*` → `packages/*/src`; `@/*` → `apps/web/*` (per-app).
- CI (`.github/workflows/ci.yml`): format → lint → typecheck → test → build → `pnpm audit`.
- Tests: Vitest, `packages/**/*.test.ts` + `tests/**/*.test.ts` (node env, `apps/**` excluded). No live-DB tests; mock/in-memory only.
- Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `format`.

### Database (migrations 0001–0008, applied to production `nbusolrfuqehhhqgausg`)

- `archive_items` — canonical item. Columns incl. `owner_id, type (archive_item_type enum: photo|video|document|post|message|audio|other), original_filename, mime_type, file_size, checksum_sha256, created_at_source, modified_at_source, archived_at, storage_provider, storage_key, metadata_json, status`. 0008 added `taken_at, latitude, longitude, width, height, duration_ms, camera` + timeline/geo indexes. Dedup: `unique(owner_id, checksum_sha256)`.
- `archive_item_sources` — provenance (multi-source): `archive_item_id, connector_account_id, source_item_id, source_url_if_safe, source_created_at, source_modified_at, source_deleted_at, metadata_json`. **This is how one canonical item carries multiple sources** (§7 duplicate + §48 provenance + §49 source-deletion).
- `connector_accounts` — connected sources (`connector_key`, `status`, `display_name`, `archive_frequency`, …).
- `archive_albums` + `archive_album_items`, `archive_people` + `archive_item_people`, `archive_places` + `archive_item_places`, `archive_item_flags (favourite, hidden)`, `archive_derivatives` — all owner-scoped, RLS default-deny.
- `archive_jobs`, `archive_job_items`, `connector_credentials`, `meta_oauth_*`, `profiles`, `security_audit_events`.
- Write path: `archive_ingest_item` RPC (SECURITY DEFINER, dedups on checksum, first-write-wins, preserves all source rows). Read path: RLS `select own`.

### Connector registry (`packages/connectors/src/registry.ts`)

Registered keys: `mock, google_drive, onedrive, dropbox, apple_photos, google_photos, phone, whatsapp, instagram, facebook, tiktok, snapchat, x`. Each declares capabilities + `implementationStatus`. Only `mock` is production. Demo needs source **labels** for: `apple_photos, whatsapp, instagram, facebook, google_photos, manual_upload/phone` (photos) and `google_drive, onedrive, dropbox, manual_upload` (documents). `manual_upload` maps to the existing `phone`/`manual` concept.

### Frontend

- App shell: `AppShell` → `Sidebar` (desktop, `NAV_GROUPS`) + `MobileNav` (bottom, `MOBILE_NAV`) + `PageHeader`. `lib/navigation.ts` is the nav config.
- Real Supabase pages: `/vandaag` (dashboard via `archive_summary` RPC), `/fotos`, `/videos`, `/documenten` (shared `ArchiveList`, signed transform thumbnails from `archief` bucket), `/bronnen` (+ `/bronnen/[id]`), `/importeren`, `/koppelen/meta`.
- Placeholders (`GenericPlaceholder`): `/mijn-leven`, `/plaatsen`, `/personen`, `/social`, `/instellingen`, `/familie`.
- UI primitives (`components/ui`): `Button`/`ButtonLink` (primary|secondary|danger|ghost × sm|md|lg), `Card`/`CardBody`, `EmptyState`, `HealthPill`/`StatusBanner`, `SourceLogo`/`ConnectedSourceRow`, `Avatar`, `Skeleton`.
- Design tokens (`tailwind.config.ts`): `forest #1D3D2A` (+hover `#142C1E`), `archive`, `warm #FAF6F1`, `surface #fff`, `ink`/`ink-soft`, `border`/`border-strong`, `brass #9B5B19`, `sage`, `success`/`warning`/`danger`, `soft-green`/`soft-amber`/`soft-red`. Radius `button 10 / card 16 / modal 20`. Font Inter (`--font-inter`). `max-w-content 1200`, `max-w-shell 1440`.
- i18n: `packages/i18n/src/messages/{nl,en}.ts` typed dictionaries; namespaces `nav, health, dashboard, sources, actions, emptyStates, auth, onboarding, imports`. Server: `getTranslations`; formatter `getFormatter`.
- Images: plain `<img loading="lazy">` with Supabase signed transform URLs. `next.config.mjs` has **no** `images.remotePatterns` (local `/public` images are fine).
- Auth: Supabase email/password; middleware protects `(app)` routes, redirects to `/inloggen`. `(app)/layout.tsx` requires a Supabase user and reads `profiles`.

## 2. What can be reused

- Design tokens, UI primitives, `PageHeader`, `EmptyState`, `SourceLogo`, `HealthPill`, app shell.
- i18n mechanism (add namespaces `photosNav, docsNav, filters, life, provenance, …`).
- The multi-source model (`archive_item_sources`) exactly matches the demo's provenance / duplicate / source-deletion requirements — the demo dataset mirrors that shape in JSON.
- `date_precision` — **not** in DB; modelled in the demo JSON and rendered by a shared date formatter.
- Nav config, `lib/cn.ts`, `formatBytes` (`@dla/shared`).

## 3. What needs to be added

Because Docker is unavailable and the only Supabase is **production** (which must not be seeded with demo rows), the demo is delivered as a **file-backed demo mode** (owner decision, 2026-09-22): the app reads seeded JSON from `/data/demo` and serves images from `apps/web/public/demo/photos`. Migrations + a Supabase seed script are shipped for later use but **not applied**.

New pieces:

1. **Seed data** (`/data/demo/*.json`, generated — never hand-authored): `demo-photos.json` (30 + multi-source relations + versions), `demo-documents.json` (24), `demo-people.json` (9), `demo-albums.json` (22 + smart albums), `demo-memories.json` (12 + B&G external ref), `demo-folders.json` (source folder trees), `demo-image-prompts.md`.
2. **Placeholder images** (`apps/web/public/demo/{photos,documents}`): deterministic Bewora-styled SVGs per filename; `resolveDemoMediaUrl()` prefers real `.jpg`/`.pdf`, falls back to generated placeholder. Generated by `scripts/demo/generate-demo-placeholders.mjs`. Small valid PDFs for documents.
3. **Demo mode**: `/demo` route sets a `bewora_demo` cookie and redirects to `/vandaag`; middleware + `(app)/layout` allow the demo session without a Supabase user; a dev-only demo profile name. `is_demo` marker lives in the JSON, never inferred from filename.
4. **Demo data-access layer** (`apps/web/lib/demo/`): typed loader (reads+validates `/data/demo`), one reusable filter/sort/group query engine (source/year/place/person/album/type/favourite + sort), timeline grouping (year→month→day), places aggregation, people aggregation, provenance/version resolution, date-precision formatting, `resolveDemoMediaUrl`.
5. **Photos experience** (`/fotos` + subnav): Alle foto's, Tijdlijn, Plaatsen, Albums, Personen, Bronnen; media detail; combinable URL-backed filters; place detail; album detail; person detail. Photo-first grid.
6. **Documents experience** (`/documenten` + subnav): Alle documenten, Categorieën, Mappen, Bronnen; document detail; document-oriented list/table (not a photo grid); filters + sort.
7. **My Life** (`/mijn-leven`): curated memories list + memory detail (photos + documents + place + date + story + external B&G reference).
8. **Dashboard** (`/vandaag`): demo counts + source status + "vandaag/jaren geleden" derived from the demo timeline.
9. **Nav + i18n**: subnav components, new namespaces.
10. **Migrations (not applied)** `0009_*` + **Supabase seed script** for the later DB path.
11. **Docs + tests + verification**.

## 4. Migration / data-loss risk

- **Zero risk to production data.** The demo is file-backed; no migration is applied and no row is written to production. `0009_*` is authored for completeness but explicitly left unapplied (owner applies with an explicit "Ja" later).
- Demo mode is additive: new routes/subroutes, a cookie gate, and new library code. Existing Supabase pages keep working unchanged (they render for a real logged-in user; in demo mode the same routes read the demo provider).
- No existing file is deleted. The `/public/demo`, `/data/demo`, `/scripts/demo` directories are new.

## 5. Implementation plan (executed after this audit)

1. Demo data spine — types + source-of-truth generator → `/data/demo/*.json` + `demo-image-prompts.md`.
2. Placeholder generator (SVG photos + tiny PDFs) + `resolveDemoMediaUrl`.
3. Demo mode (route, cookie, middleware, layout, demo profile).
4. Demo data-access layer (loader + query/filter/sort/group/timeline/places/people/provenance/date-precision).
5. Photos experience (subnav + all/timeline/places/albums/people/sources + detail + filters + place/album/person detail).
6. Documents experience (subnav + all/categories/folders/sources + detail).
7. My Life (list + detail + external reference).
8. Dashboard demo counts.
9. Nav + i18n wiring.
10. Migrations (not applied) + Supabase seed script for later.
11. Docs (`DEMO_ARCHIVE`, `ARCHIVE_DATA_MODEL`, `MEDIA_PROVENANCE`, `DOCUMENT_MODEL`, `MY_LIFE_MODEL`, `DEMO_SEED`) + README section.
12. Tests + format/lint/typecheck/build + final report.

## 6. Key design decisions

- **One archive, many views.** Source/time/place/album/person/my-life are views over the same canonical items — never separate archives (spec §1). The filter engine is a single reusable function; every "view" is a preset filter + a layout.
- **Provenance without duplication.** A canonical item holds N source relations (`sources[]` in JSON) mirroring `archive_item_sources`. Exact-duplicate photos (001/007/013/019) appear once; detail shows "2 bronnen". A compressed WhatsApp version (001) is a *version relationship*, grouped under the original, not a second gallery tile.
- **Honest dates.** `datePrecision` (EXACT_TIME|DATE|MONTH|YEAR|APPROXIMATE|UNKNOWN) drives rendering; 1978/1964/1985 render as the year only. Timeline date priority: user override → EXIF/taken → provider → source creation → (never import time).
- **Honest locations.** `locationSource` (EXIF|PROVIDER|USER|INFERRED|UNKNOWN); inferred is never shown as verified. Items without coordinates remain browsable under "Zonder locatie".
- **Safe demo.** `is_demo: true` on every record; a reset only touches demo-tagged content; no real identity/financial data in any placeholder document.
