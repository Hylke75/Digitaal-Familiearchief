# Provider setup — owner checklist

_Exactly what the project owner must do OUTSIDE the codebase to enable each
connector. Nothing here can be done from code; these are provider registrations,
approvals and secrets. Verified 2026-09-19 — re-check each provider's console as
you go. Add all secrets to server-side environment only (never `NEXT_PUBLIC_*`)._

Feature flags gate each connector in production; a connector stays hidden until
its flag is `true` AND its code + approval are complete.

---

## Google (Drive + Photos)

- [ ] Create a Google Cloud project.
- [ ] Configure the **OAuth consent screen** (External), app name, logo, support
      email, developer contact, **privacy policy URL**, terms URL.
- [ ] Enable **Google Drive API** (and **Photos Picker API** if using Photos).
- [ ] Set the app **homepage URL** = `${NEXT_PUBLIC_APP_URL}`, **privacy URL** =
      `${NEXT_PUBLIC_APP_URL}/privacy`, **terms URL** = `${NEXT_PUBLIC_APP_URL}/terms`.
- [ ] Add **authorized domain** (the Bewora production domain).
- [ ] Add authorized redirect URI: `${NEXT_PUBLIC_APP_URL}/auth/google/callback`.
- [ ] Add test users during development.
- [ ] **Scope decision — important.** Bewora's product goal is **full Drive archival**.
  - `drive.readonly` (**restricted scope**) is required for full-library archival. It
    needs **OAuth production verification + restricted-scope review + a yearly CASA
    security assessment** (paid, via a Google-approved lab).
  - `drive.file` is **NOT equivalent** to full Drive access — it only sees files the
    user explicitly picks/opens with the app. It avoids CASA but does **not** meet the
    full-archival goal. Only use it as an interim/limited mode, clearly labelled.
- [ ] Submit for **restricted scope verification** and budget for **CASA** (annual
      revalidation) before enabling full Drive archival in production.
- [ ] Add production **client ID + client secret** to secrets:
      `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- [ ] Set `GOOGLE_DRIVE_ENABLED=true` (and/or `GOOGLE_PHOTOS_ENABLED=true`) once approved.
- Note: **Google Photos full history** is only available via **Takeout** (import),
  not an API. The Library API (since 2025-03-31) only returns app-created media; the
  **Picker API** covers user-selected media.

## Microsoft (OneDrive)

- [ ] Register an app in **Microsoft Entra ID** (Azure) → App registrations.
- [ ] Set redirect URI: `https://<your-domain>/auth/microsoft/callback` (Web).
- [ ] Add **Microsoft Graph delegated permissions**: `Files.Read`, `offline_access`,
      `User.Read` (add `Files.Read.All` only if broader access is needed).
- [ ] Create a **client secret**.
- [ ] Decide single- vs multi-tenant; for consumers use "personal Microsoft
      accounts" support.
- [ ] Add secrets: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`.
- [ ] Set `ONEDRIVE_ENABLED=true`.

## Dropbox

- [ ] Create an app in the **Dropbox App Console** (scoped access, app folder or
      full Dropbox depending on need).
- [ ] Add redirect URI: `https://<your-domain>/auth/dropbox/callback`.
- [ ] Enable scopes: `files.metadata.read`, `files.content.read`, `account_info.read`.
- [ ] Use **OAuth with `token_access_type=offline`** to get refresh tokens.
- [ ] For webhooks: set the webhook URI `https://<your-domain>/api/webhooks/dropbox`
      and note the app secret (used to verify `X-Dropbox-Signature`).
- [ ] Request **production** app status when moving beyond development users.
- [ ] Add secrets: `DROPBOX_CLIENT_ID`, `DROPBOX_CLIENT_SECRET`.
- [ ] Set `DROPBOX_ENABLED=true`.

## TikTok (Data Portability API — EEA/UK only)

- [ ] Create a developer app at TikTok for Developers.
- [ ] Configure **Login Kit** + redirect URI `https://<your-domain>/auth/tiktok/callback`.
- [ ] Apply for the **Data Portability API** with a well-defined use case and
      **high-fidelity UX mockups**; pass the **privacy + security review**.
- [ ] Confirm you can distinguish EEA/UK users (the API only serves them).
- [ ] Configure the export webhook endpoint if used.
- [ ] Decide scopes (start with posts/profile; **do not** request direct messages
      unless explicitly approved by the owner for privacy reasons).
- [ ] Add secrets: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`.
- [ ] Set `TIKTOK_ENABLED=true` once approved.

## Apple (Photos — future iOS app)

- [ ] Apple Developer Program membership.
- [ ] A native iOS app (PhotoKit) — see `docs/mobile/apple-photos.md` for the API
      contract the app implements against this backend.
- [ ] Sign in with Apple (optional, for web auth parity).
- [ ] No web connector; web shows "Gebruik onze iPhone-app…".

## Meta (Instagram + Facebook)

- [ ] **Import path (works now):** none — users export via Download Your
      Information; the app detects and imports the ZIP. No owner setup.
- [ ] **Transfer path (optional, later):** apply to become a **Transfer Your
      Information receiving partner** (partnership/approval). Track as
      `META_TRANSFER_ENABLED` (default false).

## Snapchat / X

- [ ] **Import path (works now):** guided export (Snapchat *My Data*, X *account
      archive*) → user uploads ZIP. No owner setup required.
- [ ] X API (optional, later): paid API tiers — only if verified as suitable.

---

## Where secrets go

- Local dev: `apps/web/.env.local` (gitignored).
- Production/preview: Vercel project env vars (server-side, not `NEXT_PUBLIC_*`).
- The **token encryption key** `TOKEN_ENCRYPTION_KEY` (base64 32-byte) must be set
  before any OAuth connector stores credentials. Generate:
  `openssl rand -base64 32`.

## Redirect URI summary

| Provider | Redirect URI |
|---|---|
| Google | `https://<domain>/auth/google/callback` |
| Microsoft | `https://<domain>/auth/microsoft/callback` |
| Dropbox | `https://<domain>/auth/dropbox/callback` |
| TikTok | `https://<domain>/auth/tiktok/callback` |
