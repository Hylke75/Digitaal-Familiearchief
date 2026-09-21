# Meta EYI — Security review

Scope: Bewora acting as a Meta data-transfer **destination** (OAuth provider +
importer). Target: no critical/high issues before `production_enabled`. This
reviews the destination-OAuth + importer design and tracks required controls.

Status legend: ✅ implemented (core logic) · ⛭ required in the HTTP routes (next
build) · 📄 documented control.

## Threats & mitigations

| Threat | Control | Status |
| --- | --- | --- |
| **Destination-OAuth code theft/replay** | Authorization codes are opaque, cryptographically random, single-use, 60s TTL, bound to (client_id, redirect_uri, user); deleted on first exchange. | ✅ token primitives (`tokens.ts`) · ⛭ route |
| **Authorization-code injection / wrong client** | Validate `client_id` against registered Meta client; exact `redirect_uri` match (no prefix). | ✅ `redirectUriMatches` (exact) · ⛭ route |
| **Refresh-token theft** | Refresh tokens rotate on use; previous token invalidated; stored only as SHA-256 hash. | ✅ hashing · ⛭ rotation in route |
| **Token DB leak** | Tokens/codes never stored raw — only SHA-256 hashes; constant-time compare. | ✅ `hashToken`/`verifyToken` |
| **Sender impersonation / transfer spoofing** | Importer requires a valid Bearer access token that Bewora issued; token resolves to exactly one connector_account/user. | ⛭ route |
| **Cross-user transfer injection** | The access token binds the transfer to one user's connector_account; items are archived only under that owner_id via the vetted ingest RPC (RLS/owner-scoped). | ✅ ingest via RPC · ⛭ route |
| **Transfer replay / duplicate transfer** | Idempotent ingestion: content-addressed storage + dedup on (owner, SHA-256) + source relationship. Re-sending the same item is a no-op. | ✅ `ingestion.ts` + test |
| **SSRF** | Bewora never fetches attacker-supplied URLs; Meta pushes bytes to Bewora. Media metadata URLs are not dereferenced. | ✅ by design |
| **Oversized payload / archive bomb** | Per-item POSTs (not archives); size caps + streaming to bounded memory; `413 destination_full` to pause. Archive/blob ingestion (which could bomb) is out of scope (needs DTI L2). | ⛭ route caps · 📄 scope |
| **Malformed data** | Adapter is version-tolerant; items lacking a stable id/bytes are rejected safely (`failed`), never archived. | ✅ `ingestion.ts` + test |
| **RLS bypass / service-role abuse** | Importer runs server-side with the service role only to write the resolved owner's rows; never exposes the key; every write is owner-scoped. | ⛭ route |
| **Job privilege escalation** | Transfer jobs are keyed to the connector_account owner; no cross-account processing. | ⛭ route/migration |
| **Logging leakage** | Never log tokens, codes, transferred content, message bodies, or raw datasets — only operational metadata + audit event types. | 📄 policy (`audit`) |
| **Disconnect/revoke failure** | Disconnect revokes the destination authorization + rotates/invalidates tokens; archived content retained (§28). | ⛭ route |
| **CSRF on authorize consent** | `state` carried through; consent is an explicit POST with an anti-CSRF token; authenticated Bewora session required to consent. | ⛭ route |

## Non-negotiable invariants

- Source deletion ≠ archive deletion (§28) — enforced by the ingest RPC (archived copy retained).
- Sensitive categories (private messages) are **not requested** by default (`SENSITIVE_CATEGORIES_ENABLED = false`).
- No token/code/content is ever logged.

## Gate

`production_enabled` must remain **false** until the routes above implement every ⛭
control and this table has no open critical/high items.
