# Google Photos connector

_Verified 2026-09-19. Type: USER_PICKER + ARCHIVE_IMPORT._

**WHAT WORKS** — **Picker API**: user selects photos/albums in the official Google
Photos picker; the app archives the selected media. **Takeout** import for full
history (media + timestamps + albums + JSON sidecars).

**REQUIRES PROVIDER APPROVAL** — OAuth verification for the Picker scope.

**NOT AVAILABLE** — full-library background API. Since **2025-03-31** the Library
API only returns app-created media (`photoslibrary.readonly/sharing/*` removed →
403). Do NOT present Google Photos as fully automatic.

**FALLBACK** — Google Takeout guided import; future phone/device backup for
continuous photos.

Consumer copy: "Foto's selecteren" (picker) and "Help mij mijn Google-archief
importeren" (Takeout) — never labelled "automatisch".
