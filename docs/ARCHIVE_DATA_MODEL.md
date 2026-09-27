# Archive data model (demo)

The demo dataset mirrors the production canonical model (migrations 0001/0008)
in JSON so the file-backed demo exercises the same shapes. The optional DB path
is migration `0009_demo_archive_experience.sql` (unapplied).

## One canonical item, many views

A photo is one `DemoPhoto` regardless of how many sources contain it. Views
(source, time, place, album, person, my-life) are filters over the same set —
never separate archives (§1).

### `DemoPhoto` (data/demo/demo-photos.json)

| Field            | Meaning                                                             |
| ---------------- | ------------------------------------------------------------------- |
| `id`             | `demo-photo-NNN`                                                     |
| `filename`       | resolves to a real `.jpg` or a generated `.svg` placeholder         |
| `originSource`   | primary source key (Apple, WhatsApp, …)                             |
| `sources[]`      | `{key,label,primary,sourceDeletedAt}` — multi-source provenance     |
| `versions[]`     | related versions (e.g. WhatsApp-compressed) — not extra tiles       |
| `capturedAt`     | effective capture value (already resolved; never import time, §20)  |
| `datePrecision`  | `EXACT_TIME\|DATE\|MONTH\|YEAR\|APPROXIMATE\|UNKNOWN` (§19)          |
| `place`          | effective place label (user override wins)                          |
| `providerPlace`  | provider value when a user override exists (§50)                    |
| `city/country`   | location context                                                    |
| `lat/lng`        | coordinates (null → "Zonder locatie")                               |
| `locationSource` | `EXIF\|PROVIDER\|USER\|INFERRED\|UNKNOWN` (§21)                      |
| `region`         | places bucket (null → no coordinates)                               |
| `albums[]`       | album memberships (by title)                                        |
| `people[]`       | tagged people (by name)                                             |
| `favorite`       | Bewora favourite (distinct from provider favourite, §51)            |
| `is_demo`        | always true — demo content is explicitly identifiable (§43)         |

### Date resolution (§20)

Priority for the timeline date: user override → EXIF/taken → provider → source
creation → (never the import time). The JSON already carries the resolved
`capturedAt`; `datePrecision` controls rendering so no false precision is shown.

### Places (§25)

Coordinate-bearing photos are bucketed by `region`; coordinate-less photos are
grouped under **Zonder locatie**. A place aggregates all its photos regardless of
source; the place/album source distribution is computed from every source
relation of its members.

## Mapping to the database (migration 0009)

| Demo JSON                    | Table / column                                    |
| ---------------------------- | ------------------------------------------------- |
| photo core + date/location   | `archive_items` (+ `date_precision`, `location_source`, `region`, overrides, `is_demo`) |
| `sources[]`                  | `archive_item_sources` (`source_deleted_at`, `source_folder_path`) |
| `versions[]`                 | `archive_item_relationships` (`asset_relationship`) |
| albums / smart albums        | `archive_albums` / `archive_smart_albums`         |
| people                       | `archive_people` + `archive_item_people`          |
| places                       | `archive_places` + `archive_item_places`          |
| favourite                    | `archive_item_flags.favourite`                    |
| documents folders            | `archive_source_folders` + `archive_item_sources` |
| memories                     | `archive_memories` + `archive_memory_items`       |

Every table is owner-scoped with RLS default-deny (§43); the demo path only ever
seeds rows marked `is_demo = true` for a dedicated demo user.
