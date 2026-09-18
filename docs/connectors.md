# Connectors

_Status: Phase 0 — interface + honest capability registry only. No external
provider is implemented or verified yet._

## Principles

- Capabilities are **declared honestly**. A connector may only be marked
  `verified`/`production` after confirmation against **current official provider
  documentation** or tested behaviour, with the source and date recorded in the
  table below (CLAUDE.md §15).
- The onboarding UI is **generated from the registry** (`@dla/connectors`), so an
  unverified provider can never present a fake "Koppelen" button (§3, Phase 3).
- Three connector types (§16): **Live** (connect → auth → initial → incremental),
  **Portability** (request export → poll/webhook → retrieve → process), and
  **Archive importer** (user uploads an official export ZIP).
- Provider authentication is kept separate from archive ingestion (§17). We use
  only official APIs / official data-portability / official exports / device
  permissions / user-supplied archives. **No scraping, no private-API reverse
  engineering, no ToS workarounds** (§74).

## Capability registry (current, Phase 0)

Every external provider is `research` until Phase 9 verification. Only the
internal **mock** connector (no external service) is `production`.

| connector_key | type | status | requires approval | notes |
|---|---|---|---|---|
| `mock` | live | **production** | no | Internal test connector; no external service. |
| `google_drive` | live | research | yes | First real PoC (Phase 9). Verify scopes, restricted-scope review, change detection, commercial-backup restrictions before implementing. |
| `google_photos` | portability | research | yes | Likely portability/export path; verify current availability. |
| `apple_photos` | live | research | no | Device-permission path; no server OAuth. Needs a verified approach. |
| `onedrive` | live | research | no | Microsoft Graph delta APIs look promising; verify. |
| `dropbox` | live | research | no | Cursor/delta + webhooks look promising; verify. |
| `instagram` | archive_importer | research | no | Meta data-export ZIP; needs fixtures + format docs. |
| `facebook` | archive_importer | research | no | Meta data-export ZIP; needs fixtures + format docs. |
| `tiktok` | portability | research | no | Data-portability path; verify. |

## Verification log

_(empty — no external capability verified yet. Phase 9 adds
`docs/connectors/google-drive.md` classifying each capability VERIFIED /
UNAVAILABLE / REQUIRES_APPROVAL / UNKNOWN with source + date.)_

## Connector interface

See `packages/connectors/src/types.ts` — `ArchiveConnector`:
`connect, disconnect, validateConnection, discover, initialImport, getChanges,
importChanges, refreshAuthorization, getStatus`. The Archive Engine (Phase 5)
owns checksum/dedup/store/index; connectors only discover and fetch.
