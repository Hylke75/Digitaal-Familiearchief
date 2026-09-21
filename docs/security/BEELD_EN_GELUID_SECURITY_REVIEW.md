# Beeld & Geluid — security review

Scope: a reference-archive connector (search official CC0 metadata; store memory
+ link). No media is copied. Target: no critical/high issues before enabling.

| Threat | Control | Status |
| --- | --- | --- |
| **SSRF via pasted Schatkamer URL** | `parseSchatkamerUrl` requires `https:` + an allowlisted host (`schatkamer.beeldengeluid.nl`); Bewora never server-fetches an arbitrary user URL — metadata comes only from the catalog SPARQL endpoint. | ✅ `url-parser.ts` + test |
| **SSRF via search endpoint** | The catalog client targets a single hardcoded official endpoint; the user query is only a SPARQL string parameter (escaped), never a URL. | ✅ `catalog-client.ts` |
| **XSS via external metadata** | External titles/metadata are rendered as React text (auto-escaped); no `dangerouslySetInnerHTML`. HTML descriptions are not ingested (open data excludes free-text descriptions). | ⛭ enforce in UI |
| **SPARQL injection** | The query term is stripped of `"` `\` and newlines before interpolation; length-gated (≥3). | ✅ `buildSearchQuery` |
| **Rights violation (embedding protected media)** | `canEmbed` returns true only for verified public-domain/embed-allowed items; default is link-only. No iframe of protected Schatkamer pages. | ✅ `types.canEmbed` + test |
| **ToU violation (scraping)** | No Schatkamer scraping/automation — automated access only via the sanctioned open-data APIs. | ✅ by design + doc |
| **Open redirect / unsafe external link** | External links use `rel="noopener noreferrer"` + `target="_blank"`; only allowlisted/official URLs. | ⛭ UI |
| **Cross-user data access** | `memory_external_links` (personal story/times/people) is RLS per user; `external_archive_items` (shared CC0 metadata) is cacheable, no personal data. | ⛭ migration (next) |
| **Rate/abuse** | Debounced search (≥3 chars), server-side call, voluntary throttle + backoff (no documented B&G limit). | ⛭ route (next) |
| **Metadata poisoning / thumbnails** | Thumbnails not re-hosted (licence unconfirmed) → neutral placeholder; provider metadata separated from user metadata (never overwritten on refresh). | ✅ policy · ⛭ UI |

## Privacy
The user's personal story is NEVER sent to Beeld & Geluid — only the search term
reaches the catalog API. Personal annotations stay in Bewora.

## Gate
Enable only when the ⛭ UI/migration controls above are implemented and no
critical/high items remain open.
