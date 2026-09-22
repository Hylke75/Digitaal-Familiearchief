# Archive Experience — Audit & Foundation (Phase 1)

Version: 1.0 · Date: 2026-09-22 · Status: Audit complete, precedes build

This is the mandatory pre-build audit for the **Archive Experience** (how a user
browses, groups and relives their archived memories). It records the current
state with file references, names the gaps, and proposes the canonical data
model that Phase 2 implements. No code changed while producing this document.

---

## 1. Archive-browsing routes (`apps/web/app/(app)/`)

| Route | Lines | State | Renders |
| --- | --- | --- | --- |
| `vandaag` | 122 | **Real** | Greeting + health pill + `archive_summary` count card (foto/video/doc/overig) + connected-source rows. `vandaag/page.tsx:24` |
| `fotos` | 14 | **Real (thin)** | `<ArchiveList type="photo">`. `fotos/page.tsx:5` |
| `videos` | 14 | **Real (thin)** | `<ArchiveList type="video">`. |
| `documenten` | 14 | **Real (thin)** | `<ArchiveList type="document">`. |
| `bronnen` | 206 | **Real** | Source registry + connect states. |
| `bronnen/[id]` | 141 | **Real** | Per-source detail; reads its `archive_items`. |
| `koppelen/meta` | 255 | **Real** | Meta EYI / Dropbox-assisted (just shipped). |
| `importeren` | 16 | **Real** | Export-ZIP importer. |
| `meer` | 38 | **Real** | Overflow nav. |
| `mijn-leven` | 5 | **Stub** | `<GenericPlaceholder navKey="myLife">`. |
| `personen` | 5 | **Stub** | `GenericPlaceholder people`. |
| `plaatsen` | 5 | **Stub** | `GenericPlaceholder places`. |
| `social` | 5 | **Stub** | `GenericPlaceholder social`. |
| `familie` | 5 | **Stub** | `GenericPlaceholder family`. |
| `instellingen` | 5 | **Stub** | `GenericPlaceholder settings`. |

So the archive **has a working type-filtered grid** (foto/video/document) and a
count dashboard, but **every richer surface — timeline, people, places, social,
family — is an empty placeholder.**

## 2. Archive data reads

Only three real read paths exist:

- **`archive_summary()` RPC** (`0003_storage_and_ingest.sql:136`) — `security
  invoker`, counts `archive_items` per `type` for `auth.uid()`. Feeds the
  `vandaag` dashboard.
- **`ArchiveList`** (`components/archive/ArchiveList.tsx:44`) — a direct
  `from('archive_items').select(...).eq('type', type).order('created_at_source'
  desc).limit(120)` under RLS. **No pagination, no filters, no search, hard cap
  120.**
- **`bronnen/[id]`** and **`/archief/download/[id]`** — per-source list and
  original-download (signed URL).

There is **no query layer** (no `packages/archive` read helpers, no repository);
pages hit Supabase directly. Fine at this size, but there is nothing to hang
grouping/faceting/search off yet.

## 3. `archive_items` model as actually used

`archive_items` (`0001_initial_schema.sql:114`) is the generic item: `id,
owner_id, type, original_filename, mime_type, file_size, checksum_sha256,
created_at_source, modified_at_source, archived_at, storage_provider,
storage_key, metadata_json jsonb default '{}', status`. Unique `(owner_id,
checksum_sha256)` = SHA-256 dedup. Indexes on `owner_id`, `(owner_id, type)`,
`(owner_id, created_at_source desc)`.

`archive_item_sources` (`:148`) preserves every provider link.

> **Critical foundational gap: `metadata_json` is never populated.** The ingest
> RPC `archive_ingest_item` (`0003:49`) has **no metadata parameter** and inserts
> the item without it, so `metadata_json` is always `{}`. Importers *do* build a
> `metadata` object (`packages/import/src/importers.ts:24,122`) but it is dropped
> at the RPC boundary. Consequence: **no EXIF, no capture geo, no image
> dimensions, no video duration, no camera/album hints are stored anywhere.**
> Timeline/places/people cannot be built well until capture metadata is retained.

There are **no** `albums`, `people`, `faces`, `places`, `events`, `favourites`,
`timeline` or derived-asset tables. None.

## 4. Media rendering

`ArchiveList` renders thumbnails **on the fly**: for browser-renderable images
(`image/jpeg|png|webp|gif|avif`, `ArchiveList.tsx:19`) it calls
`storage.createSignedUrl(key, 3600, { transform: 600×600 cover q60 })` per item,
in parallel. Non-renderable types (**HEIC, all video, documents**) fall back to a
file card with a download icon — i.e. **photos shot on iPhone (HEIC) and every
video have no visual preview today.** Originals download via
`/archief/download/[id]`. There is **no persisted thumbnail/preview**; every grid
render re-signs and re-transforms, and formats Supabase can't transform get no
image at all.

## 5. Reusable components relevant to a browser

Present: `ui/Card`+`CardBody`, `ui/EmptyState`, `app-shell/PageHeader`,
`ui/Button`+`ButtonLink`, `ui/StatusBanner`+`HealthPill`, `ui/SourceCard`
(+`ConnectedSourceRow`), `GenericPlaceholder`. The **only** archive-specific
component is `ArchiveList`. Missing: item **detail view / lightbox**, a
**grouped/section grid**, **filter/facet bar**, **map**, **timeline rail**,
**album card**, **person chip**.

## 6. i18n

Messages are typed TS objects, not JSON: `packages/i18n/src/messages/{nl,en}.ts`
with a `shape.ts` contract. Top-level sections: `app, common, health, nav,
landing, dashboard, sources, auth, onboarding, actions, imports, emptyStates`
(`nl.ts`). `nav` already contains keys for every surface incl. `myLife, people,
places, social` — so the nav vocabulary exists even though the pages are stubs.
New experience strings must be added to **both** `nl.ts` and `en.ts` against the
`shape.ts` contract (build enforces it).

## 7. Gaps — what does NOT exist yet

1. **Capture metadata retention** (foundational) — `metadata_json` unused; ingest
   RPC drops it; no EXIF/geo/dimensions/duration extraction anywhere.
2. **Persisted thumbnails / derived assets** — none; HEIC + video have no preview.
3. **Timeline / date grouping** — no "Mijn leven", no on-this-day, no month/year
   sectioning; grid is a flat 120-item list.
4. **Albums / collections** — no table, no UI.
5. **People / faces** — stub page; no `people` model, no tagging.
6. **Places / geo** — stub page; no coordinates stored, no map.
7. **Favourites / pins / hide** — no per-item user state.
8. **Item detail view / lightbox** — no route to open a single memory.
9. **Pagination / infinite scroll** — hard cap 120; large archives silently
   truncate.
10. **Search index** — no filename/date/type search surface, no full-text.
11. **Social rendering** — posts archived as JSON blobs; `social` page is a stub,
    nothing renders them.
12. **Sharing** — none (out of MVP scope, but no seams either).

---

## 8. Proposed canonical data model (implemented in Phase 2)

Guided by CLAUDE.md §20–§24, §31–§34, §37, §43. **Additive only — never mutate the
immutable original (§32). All new tables RLS default-deny, owner-scoped (§43).**

1. **Populate capture metadata** — add a `p_metadata jsonb` parameter to
   `archive_ingest_item` and persist it into `archive_items.metadata_json` +
   `archive_item_sources.metadata_json`. Backfill importer/worker call-sites.
   Add generated/derived columns or a companion `archive_item_media` row for the
   normalised, queryable subset: `taken_at`, `width`, `height`, `duration_ms`,
   `latitude`, `longitude`, `camera`. This is the prerequisite for 3/5/6.

2. **`archive_derivatives`** — persisted thumbnails/previews:
   `(id, archive_item_id, kind[thumb|preview|poster], storage_key, mime_type,
   width, height, byte_size, created_at)`. Lets HEIC/video get server-generated
   previews and removes per-render re-transform cost.

3. **`archive_albums`** + **`archive_album_items`** — user collections;
   many-to-many, ordered.

4. **`archive_people`** + **`archive_item_people`** — a *person* is not an app
   user (§37): name, optional cover item, tagged items. Faces/recognition are
   later (§62); manual tagging first.

5. **`archive_places`** + link — named places derived from lat/long or entered
   manually.

6. **`archive_item_flags`** (or columns) — per-owner `favourite`, `hidden`,
   `cover` state, kept off the immutable item where it's user-mutable.

7. **Read helpers** — a `packages/archive` (or `apps/web/lib/archive/queries`)
   read layer: paginated timeline (month/year buckets), faceted grid, on-this-day,
   album/person/place feeds — so pages stop hand-writing Supabase queries.

**Sequencing:** (1) metadata retention → (2) derivatives → (3) timeline/detail UI
→ (4) albums → (5) people → (6) places → (7) favourites/search. Each is an
independent, testable slice; none blocks archiving reliability (§35: the archive
must work without any of this).

## 9. Risks

- **Backfill:** existing archived items have empty `metadata_json` and no
  derivatives. Model must degrade gracefully (fall back to `archived_at` when
  `taken_at` is null; no-thumb items keep the file card). A later backfill job can
  extract EXIF/generate thumbs for old items — not required for the model to land.
- **Derivative storage cost & generation:** thumbnail generation belongs in the
  worker/ingest path (server-side, sharp or Supabase transform-and-persist), never
  the browser (§31). HEIC decode needs a real decoder.
- **Privacy:** geo and faces are sensitive. Places/people are opt-in surfaces; do
  not ship face *recognition* under this phase (§59, §62). No archive content to
  third-party AI without explicit consent (§35).
- **RLS:** every new table needs enabled RLS + owner policy + a test before use
  (§43, §55).
