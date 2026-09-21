# Apple Photos / iCloud Photos — native iOS connector

**LAST VERIFIED: 2026-09-21**

**OFFICIAL SOURCES**

- Uploading asset resources in the background: https://developer.apple.com/documentation/photokit/uploading-asset-resources-in-the-background
- `PHAssetResourceUploadJob`: https://developer.apple.com/documentation/photos/phassetresourceuploadjob · `PHAssetResourceUploadJobChangeRequest`: https://developer.apple.com/documentation/photos/phassetresourceuploadjobchangerequest
- `PHBackgroundResourceUploadJobExtension`: https://developer.apple.com/documentation/photos/phbackgroundresourceuploadjobextension
- `PHAccessLevel.readWrite`: https://developer.apple.com/documentation/photos/phaccesslevel/readwrite · `PHAuthorizationStatus`: https://developer.apple.com/documentation/photos/phauthorizationstatus
- `PHAssetResourceType`: https://developer.apple.com/documentation/photos/phassetresourcetype · `PHAssetResourceRequestOptions`: https://developer.apple.com/documentation/photos/phassetresourcerequestoptions
- `PHPersistentChangeToken` / `fetchPersistentChanges(since:)`: https://developer.apple.com/documentation/photos/phpersistentchangetoken
- Privacy manifest: https://developer.apple.com/documentation/bundleresources/privacy-manifest-files

---

## Product status

**Apple Foto's = IMPLEMENTABLE — NATIVE APP REQUIRED.** Not impossible, not a web API, not manual ZIP. There is no browser flow to grant server-side iCloud Photos access; it requires a native iOS app with PhotoKit full-library permission. Consumer name is **Apple Foto's** (never "iPhoto").

## The decisive architecture fact (VERIFIED)

The background upload is **app-controlled, not Apple-defined**: `PHAssetResourceUploadJob.destination` is a **`URLRequest`** your code supplies (your endpoint + your auth headers). The OS decides *when* to run and uploads the resource to *your* URL on your app's behalf. **So Bewora needs only a normal signed-URL / one-POST-per-resource endpoint — no Apple-defined resumable protocol.** This maps onto the existing `/api/mobile/*` backend (device, upload/session, upload/complete, reconcile).

## Capability classification

| Capability | Status | Notes |
| --- | --- | --- |
| Server upload protocol is app-controlled (`URLRequest` destination) | VERIFIED | Normal signed-URL POST per resource suffices. |
| Full library permission (`.authorized`, not `.limited`) | VERIFIED / REQUIRES_NATIVE_APP | Background extension explicitly requires `.authorized`. |
| `PHAsset` → multiple `PHAssetResource` (Live Photo, RAW+JPEG, edits) | VERIFIED | Archive `.photo`/`.video`/`.pairedVideo` originals (+ `.adjustmentData`/`.fullSize*` for edits). |
| iCloud-only originals via `isNetworkAccessAllowed = true` (+ progress) | VERIFIED (iOS 9+) | Downloads the original when "Optimize iPhone Storage" removed the local copy. |
| Background upload extension | OS_VERSION_DEPENDENT | `PHBackgroundResourceUploadJobExtension` = **iOS 27+** (recommended); `PHBackgroundResourceUploadExtension` = iOS 26.1 (**deprecated in 27**). |
| Extension point id `com.apple.photos.background-upload` | VERIFIED | `processJobs() async -> PHBackgroundResourceUploadProcessingResult`, `willTerminate()`. |
| Inflight job limit `PHAssetResourceUploadJob.jobLimit` | VERIFIED | `acknowledge()` / `retry(destination:)` to free capacity. Result is `.completed`/`.processing`/`.failure` (no `limitExceeded` case). |
| Persistent changes `fetchPersistentChanges(since:)` | OS_VERSION_DEPENDENT (iOS 16+) | Detects inserted/updated/**deleted**; `persistentChangeTokenExpired` → full resync. |
| Physical-device testing required | VERIFIED | Background upload not available in Simulator. |
| Large-resource chunking/resume by OS | UNKNOWN | Docs silent; forums report no byte-range control — server accepts a single OS-driven upload per resource. |
| Info.plist upload-host validation key | UNKNOWN | A `BackgroundUploadURLBase`-style key is reported but unconfirmed — verify on the live article before shipping. |

## Deployment-target matrix (proposal)

| Target | Capability |
| --- | --- |
| **iOS 27+** | Full OS-scheduled background backup via `PHBackgroundResourceUploadJobExtension` (primary). |
| iOS 26.1 | Deprecated `PHBackgroundResourceUploadExtension` path (optional). |
| iOS 16–26 | Foreground/best-effort: full enumeration + `fetchPersistentChanges` delta + `URLSession` background uploads (fallback). |

**Recommendation:** deployment target **iOS 16.0**; gate the true background extension behind `#available(iOS 27, *)`; universal `URLSession`-background fallback for 16–26. Report to owner: fully silent auto-backup is best on iOS 27+.

## Resource / archive policy (see docs/architecture/apple-photo-resource-policy.md)

Preserve originals (`.photo`, `.video`, `.pairedVideo`, RAW) + edit sidecars where present; never archive a thumbnail/screen rendition as the original; Live Photo keeps both paired resources; identity = Apple `localIdentifier` + resource type + **SHA-256** (checksum is authoritative — localIdentifiers are not globally permanent). Source deletion never deletes the archive (§33).

## What is built where

- **Backend (exists):** `/api/mobile/*` — device registration, upload session (dedup on owner+checksum), complete (integrity), reconcile (source_deleted_at, archive retained). Shared with the Apple app.
- **Web (buildable now):** Apple Foto's source card → "Automatisch via de Bewora-app" + "Open op iPhone" universal link (`/connect/apple-photos`); registry capability matrix; status from backend.
- **iOS app + extension (REQUIRES MAC/XCODE to build/test/sign):** Swift/SwiftUI scaffold in `/apps/ios` — `PhotoLibraryService` (real + mock), `BeworaAPIClient`, `UploadService`, `DeviceRegistration`, the `com.apple.photos.background-upload` extension, models, tests. Must be tested on a physical device.
