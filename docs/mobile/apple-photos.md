# Apple Photos / iPhone — native app contract

_Apple Photos cannot be connected from a browser. A user's photo library is only
reachable through a native iOS app using **PhotoKit** (with the user's explicit
Photos permission). This document specifies (a) what works today on web and (b)
the backend API contract the future iOS app implements against — so the iPhone
connector plugs into the same archive as every other source._

## What works today (no app)

On a phone browser, the user opens `/bronnen` → **Telefoon → Importeren** and
picks photos/videos. The existing upload/import pipeline archives them (SHA-256
dedup, immutable originals). This is the honest, working fallback until the app
ships. Web copy for **Apple Foto's**: "Gebruik onze iPhone-app om Apple Foto's
automatisch veilig te stellen" (device_native, shown as coming soon).

## Native iOS app responsibilities (future)

1. Sign in to Bewora (Supabase Auth: Sign in with Apple / email) → obtain a user
   session (access token).
2. Register the device (see `POST /api/mobile/device`).
3. Request Photos permission (PhotoKit `PHPhotoLibrary`), enumerate assets
   (`PHAsset`), and for each: read the **original** resource
   (`PHAssetResourceManager`), compute SHA-256, and upload it (resumable) to the
   backend, mapping the stable **local identifier** (`PHAsset.localIdentifier`)
   to `source_item_id`.
4. Use `PHPhotoLibraryChangeObserver` (and background upload where iOS allows) to
   send new/changed assets over time.

Bewora never receives Apple credentials; the app holds the Photos permission on
device and only uploads original bytes + metadata.

## Backend API contract (to build for the app)

All endpoints require the user's Supabase session (Bearer). A `connector_account`
with `connector_key = 'apple_photos'` is created on first device registration.

### `POST /api/mobile/device`
Register/refresh a device. Body: `{ deviceName, platform: 'ios', model? }`.
Returns `{ connectorAccountId }`. Idempotent per (user, device).

### `POST /api/mobile/upload/session`
Begin a resumable upload. Body:
`{ connectorAccountId, sourceItemId, filename, mimeType, sizeBytes, checksumSha256, createdAtSource? }`.
Server dedups on `(owner, checksumSha256)`:
- already archived → `{ status: 'exists' }` (app skips the byte upload).
- new → `{ status: 'upload', uploadUrl, uploadToken }` (a resumable/TUS target in
  the private `archief` bucket under `archive/<uid>/...`).

### `PUT` (resumable upload to `uploadUrl`)
The app streams the original bytes (chunked/resumable, TUS — Supabase Storage
supports resumable uploads > 6 MB). No app memory blow-up on large videos.

### `POST /api/mobile/upload/complete`
Body: `{ connectorAccountId, sourceItemId, checksumSha256, storageKey }`.
Server verifies the stored checksum, then records the archive item + source via
the same server-side path the worker uses (`archiveBytes` logic). Returns
`{ status: 'archived' }`. Only now is the asset counted as safe (§72).

### `POST /api/mobile/reconcile`
Body: `{ connectorAccountId, presentSourceItemIds: string[] }` (or deltas).
Assets no longer present get `source_deleted_at` set — the archived copy is
**retained** (§4). Never delete the archive from a device signal.

## Security & privacy

- Reuse the existing model: RLS default-deny, per-user storage folder, encrypted
  provider tokens (n/a here — no provider token), signed download URLs.
- Uploads are validated (checksum match, size caps, content-type allow-list) and
  never executed. Plan malware scanning for arbitrary document uploads.
- The app must not log photo contents; only operational metadata.

## Owner prerequisites (when the app is built)

- Apple Developer Program membership; an iOS app + App Store review.
- (Optional) Sign in with Apple configured in Supabase Auth for web/app parity.

## Status

Reserved architecture (CLAUDE.md §10, §37; CONNECTORS_BUILD.md §19). The web
upload fallback is live; the endpoints above + the iOS app are a separate,
future build. No fake "Apple Foto's connected" state is ever shown.
