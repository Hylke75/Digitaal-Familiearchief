# Bewora iOS (Apple Foto's connector)

> **REQUIRES MAC / XCODE TO BUILD, TEST OR SIGN.** This directory contains the
> complete Swift/SwiftUI source, the background-upload app extension, mocks and
> tests. It is authored against the verified PhotoKit APIs
> (`docs/connectors/apple-photos.md`, last verified 2026-09-21) but cannot be
> compiled or run in a non-macOS environment. The background resource upload
> **must be tested on a physical iPhone** (not the Simulator).

## What this app does

Native app that archives the user's Apple Photos / iCloud Photos library into
Bewora: request full Photos permission → discover the library → upload original
resources (downloading iCloud-only originals when needed) → keep new photos
backed up automatically via the OS-scheduled background upload extension.

The upload is **app-controlled**: `PHAssetResourceUploadJob.destination` is a
`URLRequest` we point at Bewora's existing `/api/mobile/*` backend — no
Apple-defined server protocol. See `docs/architecture/apple-background-upload-protocol.md`.

## Structure

```
apps/ios/
  Bewora/
    BeworaApp.swift                  App entry (SwiftUI)
    Features/
      PhotoBackup/ConnectView.swift  Explain → request permission → progress
      BackupStatus/StatusView.swift
    Services/
      PhotoLibraryService.swift      Protocol + PhotoKit implementation
      MockPhotoLibraryService.swift  CI mock (100 photos, Live/RAW/iCloud, …)
      BeworaAPIClient.swift          Auth + device + upload sessions
      UploadService.swift            Resource fetch (incl. iCloud) + upload jobs
      DeviceRegistration.swift
    Models/ApplePhotoModels.swift
    Resources/Info.plist
    Resources/PrivacyInfo.xcprivacy
  BackgroundUploadExtension/
    BackgroundUploadExtension.swift  com.apple.photos.background-upload (iOS 27)
    Info.plist
  BeworaTests/PhotoBackupTests.swift Mock-driven unit tests
  Package.swift                      SPM description of the shared sources
```

## Owner setup

The Xcode project/workspace, signing, capabilities (Associated Domains,
background-upload extension), TestFlight and App Store steps are in
`docs/APPLE_IOS_OWNER_CHECKLIST.md` and `docs/provider-setup/apple-ios.md`.

## Config

- `Bewora API base URL` + public Supabase URL/anon key via a build-config plist
  (never the service-role key or token-encryption key — those stay server-side).
- Deployment target **iOS 16.0**; the true background extension is gated behind
  `#available(iOS 27, *)`, with a `URLSession`-background fallback for iOS 16–26.
