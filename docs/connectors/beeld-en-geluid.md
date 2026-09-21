# Beeld & Geluid / De Schatkamer — reference-archive connector

**LAST VERIFIED: 2026-09-21**

**OFFICIAL SOURCES**

- Media Catalog APIs: https://data.beeldengeluid.nl/nl/apis/nisv-media-catalog · https://data.beeldengeluid.nl/apis · SPARQL: https://cat.apis.beeldengeluid.nl/sparql · LOD server: https://github.com/beeldengeluid/beng-lod-server
- Dataset + CC0 licence: https://data.beeldengeluid.nl/nl/datasets/nisv-media-catalog · descriptions excluded: https://data.beeldengeluid.nl/showcases/welcome-to-the-odl-blog
- Schatkamer terms (scraping forbidden): https://schatkamer.beeldengeluid.nl/gebruikersvoorwaarden · FAQ/embed: https://schatkamer.beeldengeluid.nl/veelgestelde-vragen · public domain: https://schatkamer.beeldengeluid.nl/publiek-domein
- Open Beelden / Open Images (reusable media): https://data.beeldengeluid.nl/nl/apis/open-images · http://www.openimages.eu/api

---

## Product status & principle

**Beeld & Geluid = REFERENCE_ARCHIVE.** Not cloud storage, not a background sync. The user attaches a TV/radio moment to *Mijn leven*: **Bewora stores the memory + CC0 metadata + a link + the personal story; Beeld & Geluid keeps the media.** Consumer line: *"Voeg televisie- en radiomomenten toe die onderdeel zijn van jouw verhaal."* Never say "Bewora bewaart je uitzending".

## Capability classification

| Capability | Status | Notes |
| --- | --- | --- |
| Metadata SPARQL API `cat.apis.beeldengeluid.nl/sparql` (JSON, no key) | VERIFIED / SUPPORTED_BY_PUBLIC_API | The sanctioned machine-access surface. |
| Record lookup `data.beeldengeluid.nl/id/{series\|season\|program\|scene}/{daan_id}` (JSON-LD) | VERIFIED | Persistent "coolURI" — store this as the canonical record ref. |
| Full-text Search API (endpoint/params) | UNKNOWN | Advertised but undocumented → use SPARQL. |
| API key / rate limits | UNKNOWN | Appears open; throttle voluntarily (debounce, server-side cache, backoff). |
| Metadata licence | VERIFIED — **CC0** | Metadata only; **NOT** the works or thumbnails. Free-text descriptions are excluded from the open dataset → link out for synopsis. |
| Per-item rights (machine-readable) | VERIFIED | rightsstatements.org / creativecommons.org values in the catalog → gate embed-vs-link programmatically. |
| Schatkamer item URL `…/serie/{id}/{slug}/aflevering/{id}` | VERIFIED (observed) | Human-facing link target. |
| Catalog id → Schatkamer URL mapping | UNKNOWN | No official crosswalk — do NOT construct a Schatkamer URL from a catalog id (owner question). |
| Timestamped deep-link (`?start=`/`stream=`/end) | NOT_SUPPORTED (undocumented) | Fall back to the plain item URL. Bewora still stores personal start/end. |
| Embedding | SUPPORTED — **PUBLIC_DOMAIN_ONLY** | Official Insluiten for Publiek Domein items only; NL-geo-blocked. Protected = link-only, no embed, no thumbnail re-host. |
| Reusable/downloadable media | PUBLIC_DOMAIN_ONLY | Via **Open Beelden** (CC/PD), not Schatkamer. |
| Scraping / automated Schatkamer access | NOT_SUPPORTED — **forbidden by ToU** | Bots/scraping/TDM/AI-training/third-party interfaces explicitly forbidden. All automated access goes through the open-data catalog APIs; Schatkamer only for human links + PD embeds. |

## Architecture

```
User → Bewora → NisvMediaCatalogClient (SPARQL, server-side) → ExternalArchiveItem (CC0 metadata + persistent URI + rights)
                                                              → Memory (personal title/story/start-end/people) in Mijn leven
Link out (human): Schatkamer item URL. Embed: only Publiek-Domein items. Media never copied/proxied/scraped.
```

- `ExternalArchiveItem` (shared/cacheable across users) + `MemoryExternalLink` (per user, RLS). Dedup provider rows by `providerRecordId` (§37); personal story/times/people stay private.
- Rights default **link_only**; `canEmbed` true only for verified public-domain/embed-allowed items.
- SSRF: pasted Schatkamer URLs are validated against an https + hostname allowlist and never server-fetched blindly; automated metadata comes only from the catalog API.

## Built now (official public interfaces)

Verified doc; provider-neutral model + rights (`lib/beeld-en-geluid/types.ts`); SSRF-safe URL parser + deep-link builder (no invented params) + timecode helpers (tested); `NisvMediaCatalogClient` (SPARQL search + JSON-LD lookup) + adapter; feature flags; owner checklist + **partner questions**; security review.

## Needs Beeld & Geluid confirmation (owner) — unlocks

Exact Search API endpoint/fields; official catalog-id→Schatkamer crosswalk; timestamped deep-links; API keys/limits; thumbnail licence; whether the personal/non-commercial embed ToU permits use inside Bewora; descriptions in open data. See `docs/BEELD_EN_GELUID_OWNER_CHECKLIST.md`.
