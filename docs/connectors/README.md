# Connector capability matrix

_Verification pass: 2026-09-19. This matrix is the honest source of truth for
what each source can do today (CONNECTORS_BUILD.md §2, §60). It mirrors the typed
registry in `packages/connectors/src/registry.ts`. Nothing is offered as a live
"Koppelen" until it is `production` AND its feature flag is on._

## Legend

- **VERIFIED** — confirmed against current official provider documentation (date below).
- **REQUIRES_APPROVAL** — technically possible, but the provider requires app
  review / partnership / security assessment before production use.
- **UNAVAILABLE (auto)** — no official automatic API; a guided import/fallback is used.
- **UNKNOWN** — not yet verified this pass; must be checked before implementation.

## Matrix

| Source | Category | Connection type | Automatic? | Verified route | Fallback | Status | Owner approval needed |
|---|---|---|---|---|---|---|---|
| Testbron (mock) | device | live_api | ✅ | internal | — | **production** | none |
| Google Drive | documents | live_api | ✅ (changes API) | drive.readonly (restricted) or drive.file | Takeout ZIP | research | **REQUIRES_APPROVAL** — OAuth verification + CASA yearly |
| OneDrive | documents | live_api | ✅ (Graph delta) | Microsoft Graph | — | research | Azure app registration |
| Dropbox | documents | live_api | ✅ (cursor + webhook) | Dropbox API v2 | — | research | Dropbox app + production request |
| TikTok | social | portability_api | ✅ (EEA/UK) | Data Portability API | — | research | **REQUIRES_APPROVAL** — privacy+security review, EEA/UK only |
| Google Photos | photo_video | user_picker | ⚠️ partial | Picker API (user selects) | Takeout ZIP | research | OAuth verification (Picker) |
| Apple Foto's | photo_video | device_native | ✅ via iOS app | PhotoKit (native app) | local upload | research | Apple Developer + App Store |
| Instagram | social | archive_import | ❌ (import) | DYI export ZIP | guided import | research | (Transfer API = partnership) |
| Facebook | social | archive_import | ❌ (import) | DYI export ZIP | guided import | research | (Transfer API = partnership) |
| Snapchat | social | guided_export | ❌ (import) | My Data export | guided import | research | none for import |
| X | social | archive_import | ❌ (import) | account archive ZIP | guided import | research | (API = paid tiers) |
| Telefoon / lokaal | photo_video | archive_import | n/a | direct upload | — | research | none |

## Verification notes & sources (2026-09-19)

- **Google Photos** — the Library API no longer returns content not created by the
  app since **2025-03-31**; `photoslibrary.readonly/sharing/*` scopes removed →
  403. Use the **Picker API** for user-selected media; use **Google Takeout** for
  full history. There is no full-library background API. →
  https://developers.googleblog.com/en/google-photos-picker-api-launch-and-library-api-updates/ ,
  https://developers.google.com/photos/support/updates
- **Google Drive** — `drive.readonly` is a **restricted scope**: requires OAuth
  verification **and** a yearly **CASA** security assessment. `drive.file`
  (per-file, non-sensitive) avoids CASA but only sees files the user picks/creates
  with the app. →
  https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification ,
  https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- **OneDrive / Microsoft Graph** — official **delta query** tracks created/updated/
  deleted drive items; webhooks for notifications; OAuth refresh tokens. Azure
  app registration required. →
  https://learn.microsoft.com/en-us/graph/delta-query-overview ,
  https://learn.microsoft.com/en-us/onedrive/developer/rest-api/concepts/scan-guidance
- **Dropbox** — short-lived access tokens (~4h) + long-lived **refresh tokens**
  (offline access); **cursor** via `/files/list_folder` + `/continue` + `/longpoll`;
  **webhooks** signed with `X-Dropbox-Signature` (HMAC-SHA256). →
  https://developers.dropbox.com/oauth-guide , https://developers.dropbox.com/detecting-changes-guide ,
  https://www.dropbox.com/developers/reference/webhooks
- **TikTok** — **Data Portability API** (DMA-driven). Access granted after a
  privacy + security review with UX mockups; **EEA/UK users only**. Ongoing
  exports may return full datasets → must dedup by content hash. →
  https://developers.tiktok.com/products/data-portability-api/ ,
  https://developers.tiktok.com/blog/2024-introducing-tiktok-data-portability-api
- **Meta (Instagram/Facebook)** — **Download Your Information** ZIP is the reliable
  import path. **Transfer Your Information** can push media to a *receiving
  partner*, which requires registration/approval as a partner. →
  https://developers.facebook.com/docs/data-portability/ ,
  https://about.fb.com/news/2023/10/manage-your-information-across-apps/
- **Apple Photos** — no browser API for a user's full library; requires a native
  iOS app using **PhotoKit**. Backend upload API is specified in
  `docs/mobile/apple-photos.md`. (Established platform behaviour; re-verify at build.)
- **Snapchat / X** — no suitable automatic API for full historical archival for
  this use case; use guided export import (Snapchat *My Data*, X *account archive*).
  (Established behaviour; re-verify before implementation.)

## What this means for the product

- **Truly automatic today (after owner approval):** Google Drive, OneDrive,
  Dropbox (document clouds) and TikTok (EEA/UK portability).
- **Partial:** Google Photos (user picks new photos; full history via Takeout).
- **Import-first (excellent guided fallback):** Instagram, Facebook, Snapchat, X,
  and any local files.
- **Device:** Apple Photos needs the future iOS app.

No source is presented as "automatic" unless its verified route supports it.
