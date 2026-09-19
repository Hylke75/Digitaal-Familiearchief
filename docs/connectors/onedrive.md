# OneDrive connector

_Verified 2026-09-19. Type: LIVE_API (Microsoft Graph)._

**WHAT WORKS** — OAuth (refresh via `offline_access`), historical enumeration,
**delta query** for created/updated/renamed/moved/deleted items, stable item IDs,
webhooks for notifications, per-file download, metadata.

**REQUIRES PROVIDER APPROVAL** — none beyond Azure app registration + consent;
`Files.Read` + `offline_access` are delegated permissions (no admin consent for
personal accounts).

**NOT AVAILABLE** — access outside granted scopes.

**FALLBACK** — local upload.

Recommended: track by Graph **item id**, not path; store the delta link as the
cursor; deletions only set `source_deleted_at`.
