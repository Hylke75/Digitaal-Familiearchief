# Google Drive connector

_Verified 2026-09-19. Type: LIVE_API. See docs/connectors/README.md for sources._

**WHAT WORKS** — OAuth (offline/refresh), full historical listing, incremental
change tracking via the Drive **changes** API, per-file download, Google-native
file export (Docs/Sheets/Slides → portable formats, preserve original type in
metadata), source-deletion detection.

**REQUIRES PROVIDER APPROVAL** — `drive.readonly` is a **restricted scope**:
Google OAuth verification + a **CASA** security assessment (annual). Alternative
`drive.file` avoids CASA but only sees files the user opens/creates with the app.

**NOT AVAILABLE** — silent access without user consent; anything beyond granted scopes.

**FALLBACK** — Google Takeout ZIP import (guided) for full history without CASA.

Recommended: implement with `drive.file` first (ships without CASA), offer
`drive.readonly` as an upgrade once CASA is complete. Use `changes.list` +
`startPageToken` for incrementals; never full-rescan.
