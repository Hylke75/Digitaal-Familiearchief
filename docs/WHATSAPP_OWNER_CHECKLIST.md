# WhatsApp media — owner action checklist

WhatsApp is one Bewora source with per-platform ingestion (docs/connectors/whatsapp.md,
verified 2026-09-21). What's built vs what needs you:

**Built now (no device):** verified doc, feature flags, the **WhatsApp chat-export
importer** (works today — users upload a WhatsApp "Export chat" package and Bewora
archives the media with reliable dates + `origin_source: whatsapp` provenance),
the WhatsApp source card (Importeren), and this checklist.

**Requires device / external (native, authored as scaffold + owner steps below).**

## IMPORT (works today — verify)
- [ ] Create a synthetic WhatsApp export (a `_chat.txt` + `IMG-YYYYMMDD-WA####.jpg`/`VID-…` files) and upload it via **Bronnen → WhatsApp → Importeren**; confirm media is archived with the correct date.
- [ ] Localisation: test exports from a couple of locales/date formats (parser reads dates from the WA filename, which is locale-independent).

## iOS (rides on Apple Foto's)
- [ ] Ship the Apple Foto's app first (docs/APPLE_IOS_OWNER_CHECKLIST.md) — WhatsApp future media flows in when the user enables **WhatsApp → Settings → Chats → Save to Camera Roll**.
- [ ] (Optional) Build an iOS **Share Extension** so users can share an Export Chat straight into Bewora.
- Copy for the app: *"Zet in WhatsApp 'Bewaren in Foto's' aan voor de gesprekken die je wilt bewaren."* Bewora cannot toggle this itself.

## Android (native app — REQUIRES ANDROID STUDIO + DEVICE)
- [ ] Android developer account + Play Console app.
- [ ] Declare media permissions `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` (+ `READ_MEDIA_VISUAL_USER_SELECTED` on 14+); handle full/partial/denied.
- [ ] **Google Play Photo & Video permissions declaration** — justify continuous backup makes the Photo Picker insufficient (docs/provider-review/google-play/whatsapp-media-backup.md). Approval not guaranteed.
- [ ] Decision: WhatsApp's default media store is app-private (`Android/media/com.whatsapp/…`), NOT readable via normal MediaStore. Two paths:
  - **Privacy-clean (default):** only archive WhatsApp media the user made **gallery-visible** (WhatsApp → Media visibility). Origin tagged "probable" via the `WhatsApp Images`/`WhatsApp Video` bucket (OWNER_PACKAGE_NAME is redacted on Android 14+).
  - **Complete archive:** request `MANAGE_EXTERNAL_STORAGE` (All-files) — Play lists "Backup and restore" as eligible but it is form-and-review gated. Behind `WHATSAPP_ANDROID_ALL_FILES_ACCESS_ENABLED` (default OFF); needs your explicit go + a Play declaration.
- [ ] Physical-device testing (Simulator insufficient for MediaStore/WorkManager behaviour).

## Privacy / policy
- [ ] Add the WhatsApp paragraph to `/privacy` (Android: reads gallery media to preserve supported sources; iOS: no WhatsApp app access — via Apple Photos / user export).
- [ ] Never claim an "official WhatsApp integration".

## Hard limits (product copy must reflect)
- No API to read private WhatsApp media on any OS.
- **View Once** is never archivable.
- Encrypted WhatsApp iCloud/Drive backups are not decrypted.
