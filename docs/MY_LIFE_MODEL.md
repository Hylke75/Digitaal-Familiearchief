# My Life model (demo)

"Mijn leven" is **not** the photo timeline. It is a set of curated memories that
pull loose files back together into events (§36, §37). Each memory can link
photos, documents, a place, a date and a story — and, optionally, an external
archive reference.

## `DemoMemory` (data/demo/demo-memories.json)

| Field               | Meaning                                              |
| ------------------- | ---------------------------------------------------- |
| `id`                | `demo-memory-NNN`                                     |
| `title`             | e.g. "Nieuwe woning"                                  |
| `date`              | when it happened                                     |
| `datePrecision`     | honest precision (YEAR/MONTH/DATE)                   |
| `place`             | place label or null                                  |
| `story`             | short narrative (fictional demo story)               |
| `photoIds[]`        | linked canonical photos (no duplication of files)   |
| `documentIds[]`     | linked documents                                     |
| `externalReference` | optional external archive fragment (see below)      |
| `is_demo`           | always true                                          |

13 memories span 1964 → 2026, including the old scans and the recent trips.

### Example: "Nieuwe woning" (2019-06-18)

- Photos: `019` (woning), `020` (verhuisdozen), `030` (koopakte contractmap)
- Documents: Koopakte woning, Hypotheekofferte, Taxatierapport
- The underlying files are **linked**, never duplicated.

## External archive reference (§16)

One memory, *"Mijn eerste televisieoptreden"*, demonstrates linking an external
archive fragment without inventing a real record:

```
Provider:  Beeld & Geluid
Programma: Demo-programma
Datum:     2000
Fragment:  17:28 – 19:12
Status:    DEMO
```

It renders with a clearly-labelled **"Demo — extern archieffragment"** badge and
never links to a fabricated real Beeld & Geluid URL. This shows how the feature
will work while staying honest.

## Relation to the database (migration 0009)

Memories map to `archive_memories`; links map to `archive_memory_items`
(referencing canonical `archive_items`). The external reference fields live on
`archive_memories`. Everything is owner-scoped with RLS default-deny.
