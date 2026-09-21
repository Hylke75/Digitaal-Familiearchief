# WhatsApp media — connector

**LAST VERIFIED: 2026-09-21**

**OFFICIAL SOURCES**

- WhatsApp: Save to Camera Roll — https://faq.whatsapp.com/366146522333492 · Media visibility — https://faq.whatsapp.com/5503646096388294 · Export chat — https://faq.whatsapp.com/1180414079177245 · View Once — https://blog.whatsapp.com/view-once-photos-and-videos-on-whatsapp
- Android media: https://developer.android.com/training/data-storage/shared/media · partial access (Android 14) https://developer.android.com/about/versions/14/changes/partial-photo-video-access · All files access https://developer.android.com/training/data-storage/manage-all-files · MediaStore https://developer.android.com/reference/android/provider/MediaStore
- Google Play Photo & Video policy: https://support.google.com/googleplay/android-developer/answer/14115180 · All files access policy https://support.google.com/googleplay/android-developer/answer/13959202
- Apple PhotoKit: see docs/connectors/apple-photos.md

---

## Product status

**WhatsApp = IMPLEMENTABLE per platform — no direct API.** One user-facing source; different ingestion underneath. Consumer promise: *"Bewaar de foto's en video's die je via WhatsApp ontvangt in je Bewora-archief."* Never claim Bewora downloads a complete WhatsApp account automatically, and never claim an official WhatsApp partnership.

## Decisive verdicts

| Platform / route | Verdict | Notes |
| --- | --- | --- |
| Direct read of private WhatsApp media (any OS) via API | NOT_SUPPORTED | No consumer API; chats are E2E-encrypted in-app. (Business/Cloud API is business↔customer only — do NOT use for this, §4.) |
| iOS: future media via Apple Foto's | REQUIRES_USER_SETTING | Works when the user enables WhatsApp → Settings → Chats → **Save to Camera Roll** (per-chat Default/Always/Never). Then the Apple Photos connector archives it. |
| iOS: historical WhatsApp-only media | IMPORT_ONLY | User-initiated **Export Chat** (per chat, txt + media via share sheet) → Bewora importer / share extension. |
| Android: WhatsApp media via normal MediaStore | PLATFORM_DEPENDENT / REQUIRES_USER_SETTING | Only reachable with `READ_MEDIA_IMAGES/VIDEO` if the user made it **gallery-visible** (Media visibility). WhatsApp's default store is app-private `Android/media/com.whatsapp/…`, **not** in MediaStore. |
| Android: complete WhatsApp media archive | REQUIRES `MANAGE_EXTERNAL_STORAGE` | All-files access to read `Android/media/com.whatsapp/…`. Play lists "Backup and restore" as eligible but it is review-gated; **default OFF**. |
| Android provenance = WhatsApp | probable-only on Android 14+ | `OWNER_PACKAGE_NAME` is redacted cross-app on 14+; best signal is `BUCKET_DISPLAY_NAME`/`RELATIVE_PATH` ("WhatsApp Images/Video") → confidence-aware provenance (§8). |
| View Once media | NOT_SUPPORTED | Protected by design; never work around it. |
| WhatsApp encrypted iCloud/Drive backups | NOT_SUPPORTED | No decryption/extraction (§29). |

## Architecture (one source, per-platform ingestion)

```
iPhone:   WhatsApp → (Save to Camera Roll) → Apple Foto's → Bewora   [+ Export Chat → import]
Android:  WhatsApp shared media → MediaStore (if gallery-visible) → Bewora Android app → Bewora
          (complete archive → All-files access, Play-review-gated, default off)
Historic: user Export Chat (txt + media) → Bewora WhatsApp importer (any platform)
```

- **ingestion_source** (how it entered: `apple_photos` / `whatsapp_android` / `whatsapp_export`) is separate from **origin_source** (`whatsapp`) with **origin_confidence** (`verified` / `probable` / `unknown`), §8/§30. Never label WhatsApp on weak heuristics.
- Reuses the existing archive engine (checksum, dedup, source relationships, `/api/mobile/*`) — no separate storage stack. Source deletion ≠ archive deletion (§33).

## Built now (buildable, no device)

- This verified doc; feature flags (`.env.example`); the **WhatsApp chat-export importer** (`@dla/import`, tolerant of locales/versions); web source card + taxonomy; provenance model; owner checklist, security review, Play-review doc.

## Requires device (native, authored as scaffold)

- **Android app** (Kotlin/Compose/WorkManager/MediaStore) — historical scan of gallery-visible WhatsApp media + `getGeneration()`/`GENERATION_ADDED` incremental delta + WorkManager periodic backup. `MANAGE_EXTERNAL_STORAGE` behind a default-off flag with a Play declaration.
- **iOS share extension** — receive an Export Chat package into Bewora. Future auto media rides on the Apple Foto's connector.

## Do-not

Never: read WhatsApp private DBs, decrypt backups, bypass View Once, circumvent OS media permissions, or claim an official WhatsApp integration.
