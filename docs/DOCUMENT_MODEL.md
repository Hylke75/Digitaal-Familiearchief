# Document model (demo)

Documents are a **document-oriented** library, not a photo gallery (§3, §32).
Two independent concepts coexist: Bewora **categories** (classification) and
provider **source folders** (where the file physically lived). Neither is
derived from the other (§13, §35).

## `DemoDocument` (data/demo/demo-documents.json)

| Field          | Meaning                                                   |
| -------------- | -------------------------------------------------------- |
| `id`           | `demo-doc-NNN`                                            |
| `title`        | display name (also the filename)                         |
| `placeholder`  | file served under `/demo/documents/` (a valid demo PDF)  |
| `category`     | Woning, Financieel, Verzekeringen, Contracten, Belasting, Opleiding, Overig |
| `source`       | `google_drive\|onedrive\|dropbox\|manual_upload`         |
| `folder`       | original source folder path (e.g. `Mijn Drive/Privé/Huis/Hypotheek`) or null |
| `documentDate` | the document's own date                                  |
| `modifiedAt`   | last modified                                            |
| `mimeType`     | `application/pdf`                                        |
| `fileSize`     | bytes                                                    |
| `tags[]`       | free tags                                                |
| `is_demo`      | always true                                              |

24 documents span all four sources and all seven categories.

## Views (§32–§35)

- **Alle documenten** — list with combinable filters (Categorie, Bron, Jaar,
  zoeken) and sort (Datum document, Laatst gewijzigd, Naam A–Z/Z–A, Nieuw/Oudst
  toegevoegd).
- **Categorieën** — the seven categories with counts → filtered list.
- **Mappen** — pick a source and browse its **original folder tree**
  (`archive_source_folders`-shaped), e.g. Google Drive → Privé → Huis →
  Hypotheek. Folders come from source metadata, not categories.
- **Bronnen** — the four document sources → the same library filtered.

## Document detail (§36)

Preview (iframe of the demo PDF), title, document date, category, source,
original folder, file type, size, tags, and a link to any memory the document
belongs to. No arbitrary/unsafe file rendering — only the seeded demo PDFs.

## Placeholders (§14)

Until real PDFs are supplied, `generate-demo-placeholders.mjs` writes small valid
PDFs containing `DEMO DOCUMENT`, the title, fictional metadata and the line
*"Dit document bevat uitsluitend fictieve demogegevens."* No fake passports, bank
numbers or signatures are ever produced.
