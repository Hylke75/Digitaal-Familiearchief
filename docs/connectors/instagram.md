# Instagram connector (Meta)

_Verified 2026-09-19. Type: ARCHIVE_IMPORT (+ optional partner Transfer)._

**WHAT WORKS** — guided import of the **Download Your Information** export ZIP
(photos, videos, posts, supported metadata). Auto-detected on upload; both
Facebook and Instagram are detected if present in one Meta export.

**REQUIRES PROVIDER APPROVAL** — the **Transfer Your Information** partner route
(push media to a receiving partner) requires becoming an approved Meta partner.

**NOT AVAILABLE** — a general API to silently pull a user's complete archive forever.

**FALLBACK** — the guided archive import IS the primary path. Parsers must be
version-tolerant; unknown files must never crash the import.
