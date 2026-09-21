# Meta EYI (Export Your Information / Data Portability) — Facebook + Instagram

**LAST VERIFIED: 2026-09-21**

**OFFICIAL SOURCES**

- Meta Data Portability overview / onboarding: https://developers.facebook.com/docs/data-portability/onboarding-guide/
- Deep Linking guide + params: https://developers.facebook.com/docs/data-portability/deep-link-guide/ · https://developers.facebook.com/docs/data-portability/deep-link-params/
- Changelog: https://developers.facebook.com/docs/data-portability/changelog
- DTP Generic Importers (the canonical destination contract): https://github.com/dtinit/data-transfer-project/blob/master/extensions/data-transfer/portability-data-transfer-generic/README.md
- Data Transfer Initiative: https://dtinit.org/ · Data Trust Registry: https://dt-reg.org/ · application guide: https://www.dt-reg.org/application-guide/

Meta developer pages do not expose a "last updated" date (UNKNOWN); content retrieved 2026-09-21, changelog current through June 2026.

---

## Product status

**Facebook and Instagram = IMPLEMENTABLE — EXTERNAL APPROVAL REQUIRED.** Not impossible, not ZIP-only. The Bewora side is built and mock-tested now; production connection is gated on DTI + Meta approval (see `docs/META_EYI_OWNER_CHECKLIST.md`). ZIP import remains a fallback.

## The protocol in one paragraph (DTP model)

**Bewora is the OAuth 2.0 provider AND the data importer; Meta is the OAuth client AND the pusher.** The user starts a transfer at Meta (Accounts Center / "Export/Transfer Your Information"), chooses Bewora as destination → Meta redirects the user to **Bewora's authorize endpoint** → the user consents → Bewora returns an **authorization code** to Meta → Meta exchanges it at **Bewora's token endpoint** for an access token (+ optional refresh token) → **Meta's transfer worker PUSHES the data item-by-item via HTTP POST** to Bewora's importer endpoints (`/media`, `/photos`, `/videos`, `/social-posts`, `/blobs`, `/calendar`). There is **no Meta-hosted API for Bewora to call, and no completion webhook** — Bewora receives a stream of POSTs and tracks its own state.

## Capability classification

| Capability | Status | Notes |
| --- | --- | --- |
| Bewora hosts its own OAuth 2.0 provider (authorize/token/revoke/refresh) | VERIFIED | Meta is the client; Bewora issues codes/tokens. |
| Generic Importer HTTP endpoints (`POST /media`,`/photos`,`/videos`,`/social-posts`,`/blobs`,`/calendar`) | VERIFIED | Bearer-authenticated; one item per POST. |
| Transfer format: `GenericPayload` JSON; `multipart/related` (metadata + raw bytes) for files | VERIFIED | Containers (albums/folders) sent before their items. |
| Status semantics: `20x`, `429` (backoff), `413 destination_full` (pause), `401 invalid_token` (refresh), `401 session_invalidated` (stop) | VERIFIED | No completion webhook — track per-item state. |
| Deep-link with preselected destination/source/history/quality/frequency | VERIFIED (params) / REQUIRES_META_APPROVAL (live) | Base: `accountscenter.facebook.com/info_and_permissions/dyi` & instagram equivalent. |
| First transfer = full history (`date_range=ALL_TIME`) | VERIFIED | `CUSTOM` + `start`/`end` epoch seconds for a window. |
| Recurring: `ONCE_A_DAY/MONTH/YEAR_FOR_{ONE,TWO,THREE}_YEARS`, max 3 years | VERIFIED | `ONE_TIME` for a single transfer. |
| Weekly recurring | UNKNOWN | UI weekly shipped June 2026; a `schedule_frequency` **weekly enum is unconfirmed** — do NOT fake weekly. |
| Categories: `sections[]` enum (~74 FB, ~31 IG); photos/videos bundled in "your activity" | VERIFIED | Messages are separate enums (`MESSENGER_V2`, `IG_MESSAGES`). |
| Archive/blob transfers | REQUIRES_DTI_APPROVAL | Need DTI Trust **Level 2** (SOC 2 audit). |
| DTI Trust Registry Level 1 listing | REQUIRES_DTI_APPROVAL | 5-item checklist (see owner checklist). |
| Meta destination onboarding + `import_service` Service ID assignment + release | REQUIRES_META_APPROVAL | Email `dataportability@meta.com` to release. |
| Worldwide availability | VERIFIED (registry) / UNKNOWN (per-country live list) | Not DMA-only; rollout is region-by-region. |
| `import_service` Service ID assignment mechanism | UNKNOWN | Assigned by Meta during onboarding. |
| `redirect_uri` allowlisting semantics | UNKNOWN | Meta allowlists pre-approved client-id + redirect combos. |

## Deep-link parameters (verified)

Base: `https://accountscenter.facebook.com/info_and_permissions/dyi` (Instagram: `accountscenter.instagram.com/...`).

| Param | Meaning | Values |
| --- | --- | --- |
| `source` | external entry (required) | `external` |
| `account_type` | source platform | `0`=Facebook, `1`=Instagram |
| `import_service` | destination (Bewora's assigned Service ID) | assigned by Meta |
| `sections[n]` | categories (preselected, user-editable) | enum ids |
| `date_range` | history window | `ALL_TIME`, `LAST_YEAR`, `LAST_3_YEARS`, `CUSTOM`, … |
| `quality` | media quality | `LOW`, `MEDIUM`, `HIGH` |
| `schedule_frequency` | recurrence | `ONCE_A_DAY_FOR_THREE_YEARS`, … |
| `redirect_uri` | user return URL after submit | Bewora URL (not the data channel) |

## What Bewora implements (buildable now, mock-driven)

1. **OAuth 2.0 provider**: authorize (consent → code), token (code→access+refresh), revoke, refresh. Short-lived single-use codes, rotating refresh tokens, exact redirect + client validation, audit logging (`lib/meta-eyi/tokens.ts`, `app/api/meta/oauth/*`).
2. **Generic Importer endpoints**: `POST /api/meta/import/{media,photos,videos,social-posts}` — Bearer-auth resolves the destination token → user + connector_account; parse `GenericPayload`/`multipart-related`; archive via the existing engine (checksum → dedup → ingest RPC); return the correct status codes.
3. **Adapter** (`lib/meta-eyi/adapter.ts`): `GenericPayload` (Album/Photo/Video/SocialActivity) → Bewora domain items.
4. **Deep-link builder** (`lib/meta-eyi/deeplink.ts`): typed, verified params only.
5. **Mock sender** (`lib/meta-eyi/mock-sender.ts`): initial/recurring/duplicate/expired/revoked/malformed/large — finishes the Bewora side before approval.
6. **Idempotency**: dedup on `(owner, sha256)` + source relationship, so repeated full exports never duplicate (§17).

## Data minimisation (initial scope)

Request only what serves the archive promise: **photos, videos, posts, stories** + media/context metadata. **Private messages are DISABLED by default** (sensitive-category flag) pending a separate product/privacy decision. See `lib/meta-eyi/categories.ts`.

## Known gaps / do-not-fake

- No completion webhook → Bewora tracks its own per-item state and infers completion from the stream stopping.
- Weekly recurring deep-link value unconfirmed → not offered.
- `import_service` ID + exact redirect allowlisting → filled in during Meta onboarding, kept in config/env, never invented.
