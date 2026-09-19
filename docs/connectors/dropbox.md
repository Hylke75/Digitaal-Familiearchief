# Dropbox connector

_Verified 2026-09-19. Type: LIVE_API._

**WHAT WORKS** — OAuth with `token_access_type=offline` (short-lived access token
~4h + long-lived refresh token), historical listing, **cursor** incrementals
(`/files/list_folder` + `/continue` + `/longpoll`), **webhooks** signed with
`X-Dropbox-Signature` (HMAC-SHA256), download, metadata, deletion detection.

**REQUIRES PROVIDER APPROVAL** — Dropbox app registration; request **production**
status to serve users beyond development.

**NOT AVAILABLE** — access outside granted scopes.

**FALLBACK** — local upload.

Recommended: webhook → enqueue reconciliation (payload does NOT contain file
contents); always reconcile via cursor. Verify the HMAC signature on every webhook.
