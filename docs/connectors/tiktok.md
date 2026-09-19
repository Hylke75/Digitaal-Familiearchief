# TikTok connector

_Verified 2026-09-19. Type: PORTABILITY_API (EEA/UK only)._

**WHAT WORKS** — official **Data Portability API**: request an export, poll/webhook
for completion, download official export server-side, ingest media + supported
metadata. Repeat per user frequency/provider restriction.

**REQUIRES PROVIDER APPROVAL** — application with a well-defined use case, UX
mockups, and a **privacy + security review**. Login Kit. Serves **EEA/UK users
only**; you must distinguish those users.

**NOT AVAILABLE** — full ongoing "live" streaming access; complete archival is via
periodic exports. Direct messages: do not request unless the owner approves.

**FALLBACK** — none official beyond the portability export.

Recommended: exports may return the FULL dataset each time → dedup by SHA-256 and
only add new/changed source relationships; never create duplicate media objects.
