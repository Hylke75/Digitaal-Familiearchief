# Beeld & Geluid — owner action checklist

Reference-archive connector (docs/connectors/beeld-en-geluid.md, verified 2026-09-21).
Bewora stores memory + CC0 metadata + link; B&G keeps the media.

## CAN BE DONE WITHOUT B&G CONTACT (built / buildable now)

- [x] Metadata **search + record lookup** via the official open-data SPARQL API (`cat.apis.beeldengeluid.nl/sparql`) — no key, CC0 metadata. Built (`NisvMediaCatalogClient`).
- [x] Store the persistent record URI (`data.beeldengeluid.nl/id/{type}/{daan_id}`) as the canonical reference.
- [x] Personal memory: title, story, start/end times, people, tags (Bewora-only).
- [x] **Link-only** to Schatkamer for humans; **embed only** verified Publiek-Domein items.
- [x] SSRF-safe pasted-URL handling (https + hostname allowlist).
- [ ] Full search/memory UI + `external_archive_items` / `memory_external_links` migration (next build).

## MUST NOT (verified constraints)

- Do NOT scrape or programmatically hit **schatkamer.beeldengeluid.nl** — its terms forbid bots/scraping/TDM/AI-training/third-party interfaces. All automated access goes through the open-data catalog APIs only.
- Do NOT download/proxy/host protected media or re-host thumbnails.
- Do NOT construct a Schatkamer URL from a catalog id (no official crosswalk).
- Do NOT emit a timestamped deep-link (`?start=`) — undocumented; fall back to the plain item URL.

## CONFIRM WITH BEELD & GELUID (unlocks features)

Contact: `zakelijk@beeldengeluid.nl` (business) / the Open Data Lab / DAAN team.

1. Exact **Media Catalog Search API** endpoint + query fields (title/person/date/omroep/series) — is there a `cat.apis.beeldengeluid.nl/search`? (Today we use SPARQL.)
2. Official **crosswalk** from a catalog `daan_id` / `data.beeldengeluid.nl/id/...` URI → a **Schatkamer** `/serie/.../aflevering/{id}` playable URL?
3. Are **timestamped deep-links** (start/stream/end) officially supported/planned, with a stable param contract?
4. **API keys / rate limits** on SPARQL/Search (now or planned)?
5. Are catalog **thumbnails/posters** exposed via the API, and under what licence for third-party display?
6. Does the personal/non-commercial Schatkamer **embed** ToU permit use inside a consumer archive product like Bewora (for Publiek-Domein items)?
7. Does the CC0 open dataset include **descriptions/synopses**, or is link-out the only sanctioned way to surface them?

## Partner proposal (short — docs/provider-review/beeld-en-geluid/)

Bewora is a personal digital-life archive. Users attach *"a television or radio moment that is part of their personal history"* (they appeared on TV, a parent was interviewed, a family event was in the news). **Bewora hosts no copyrighted AV media** — B&G stores/streams; Bewora stores the personal memory/reference; an official link/embed connects them. Value for B&G: personal relevance, Schatkamer discovery, a new bridge between national media history and individual life stories, no duplication of protected media. (No commercial terms promised.)
