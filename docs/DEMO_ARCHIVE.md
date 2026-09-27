# Bewora demo archive

A complete, working demonstration of the Bewora archive experience, driven by
real seeded data (not static screens). It shows the core Bewora idea: **one
archive, many views** — the same photos and documents seen through source, time,
place, album, person and "My Life" lenses.

> "Bewaar wat van jou is." One archive. Sources are just where things came from.

## How to run

See [DEMO_SEED.md](./DEMO_SEED.md). In short: `pnpm install && pnpm seed:demo &&
pnpm dev`, then open `/demo`.

## What you can demonstrate

- **Foto's** (`/fotos`) with a secondary navigation:
  - **Alle foto's** — photo-first grid with combinable, URL-backed filters
    (bron, jaar, plaats, persoon, favoriet) and sort (datum gemaakt / toegevoegd).
  - **Tijdlijn** — everything chronological, grouped year → month → day, with a
    year jump. Old scans (1964/1978/1985) appear under their year, never today.
  - **Plaatsen** — a map + place cards; a place (e.g. Madeira) mixes sources.
  - **Albums** — Mijn albums + Slimme albums (dynamic rules).
  - **Personen** — people cards → per-person view.
  - **Bronnen** — Apple Foto's, WhatsApp, Instagram, Facebook, Google Photos,
    Handmatig toegevoegd. Clicking one filters the SAME archive.
- **Foto-detail** — immersive viewer with date (precision-aware), place (with
  location source + user override), people, albums, **herkomst** ("2 bronnen"),
  **versies** (WhatsApp-compressed), download.
- **Documenten** (`/documenten`) — a document-oriented library with Alle,
  Categorieën, Mappen (provider folder trees) and Bronnen; filters + sort; a
  document detail with preview, metadata, original folder and linked memory.
- **Mijn leven** (`/mijn-leven`) — curated memories that pull photos and
  documents together, including a clearly-labelled external Beeld & Geluid demo
  fragment.
- **Vandaag** — a calm dashboard with data-driven totals and a "jaren geleden"
  memory.

## Core concepts on display

| Concept            | Where                                                      |
| ------------------ | --------------------------------------------------------- |
| One archive        | Every view is a filter over the same items (§1)           |
| Provenance         | `demo-photo-001` shows "2 bronnen" (Apple + Google) (§48) |
| Deduplication      | That duplicate appears **once** everywhere (§23, §62)     |
| Version grouping   | WhatsApp-compressed version under the original (§8)       |
| Source deletion    | A Google Photos link on `019` is tombstoned; item stays (§49) |
| User override      | `006` place is user-set over the provider value (§50)     |
| Honest dates       | 1978 renders as "1978", not "1 januari 1978" (§19, §63)   |
| Honest locations   | Location source shown; no-coordinate items → "Zonder locatie" |
| Mixed-source place | Madeira mixes Apple + Instagram (+ WhatsApp) (§26, §61)   |

## Architecture (file-backed mode)

```
scripts/demo/demo-source.mjs        # single source of truth (fictional data)
scripts/demo/build-demo-data.mjs    # → /data/demo/*.json + image prompts + manifest  (pnpm seed:demo)
scripts/demo/generate-demo-placeholders.mjs  # Bewora-styled SVGs + valid demo PDFs
data/demo/*.json                    # seeded, validated data the app reads
apps/web/lib/demo/*                  # loader, mode, media resolver, dates, query engine
apps/web/components/demo/*           # PhotoGrid, SubNav, CoverCard, PlacesMap, filters
apps/web/app/(app)/{fotos,documenten,mijn-leven,...}  # demo-aware routes
```

The demo is enabled by the `bewora_demo` cookie (set at `/demo`). In demo mode
the routes read the seeded JSON; without it, the existing Supabase-backed
behaviour is preserved unchanged. Production data is never read or written by the
demo.

See also: [ARCHIVE_DATA_MODEL.md](./ARCHIVE_DATA_MODEL.md),
[MEDIA_PROVENANCE.md](./MEDIA_PROVENANCE.md),
[DOCUMENT_MODEL.md](./DOCUMENT_MODEL.md),
[MY_LIFE_MODEL.md](./MY_LIFE_MODEL.md),
[DEMO_ARCHIVE_IMPLEMENTATION_AUDIT.md](./DEMO_ARCHIVE_IMPLEMENTATION_AUDIT.md).
