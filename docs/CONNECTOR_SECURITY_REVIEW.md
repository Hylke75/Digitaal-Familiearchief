# Connector security review — Bewora

_Status: Phase A (foundation) reviewed 2026-09-19. Live OAuth connectors are not
implemented yet; this review covers the foundation and the import path, and lists
the checks to perform as each live connector lands (CONNECTORS_BUILD.md §58)._

Severity: CRITICAL / HIGH / MEDIUM / LOW.

## Reviewed and OK (current code)

| Area | Status | Notes |
|---|---|---|
| RLS default-deny | OK | All user tables RLS-enabled; owner-scoped policies; advisors clean. |
| Service-role usage | OK | App uses no service-role key; writes go via the vetted `archive_ingest_item` SECURITY DEFINER RPC (validates `auth.uid()` + ownership). |
| Cross-user access | OK | Storage RLS scopes objects to the user's uid folder; signed URLs are short-lived; download route checks ownership under RLS. |
| Token encryption | OK (foundation) | AES-256-GCM envelope + `ProviderCredentialStore`; key server-side only; never logged. DB-backed backend lands with the first OAuth connector. |
| ZIP security | OK | Path-traversal + zip-bomb (per-entry/total size) + entry-count guards; unsafe names skipped; content never executed. Tested. |
| Logging leakage | OK | `redactSecrets` strips tokens/secrets; no tokens/content in logs. |
| Signed URLs | OK | 60s expiry; generated server-side per request. |

## To verify as each LIVE connector is implemented

| Check | Severity if wrong | Applies to |
|---|---|---|
| OAuth `state` validation (CSRF) | HIGH | Google, MS, Dropbox, TikTok |
| PKCE where supported | HIGH | all OAuth |
| Redirect URI allow-list (no open redirect) | HIGH | all OAuth |
| Provider-account linking attacks (bind provider id to the authed user) | HIGH | all OAuth |
| Refresh-token rotation + revocation on disconnect | HIGH | all OAuth |
| Webhook signature verification (e.g. Dropbox `X-Dropbox-Signature`) | HIGH | Dropbox, TikTok |
| Webhook replay protection + idempotency | MEDIUM | Dropbox, TikTok |
| SSRF on server-side downloads (validate provider hosts) | HIGH | portability downloads |
| Job privilege escalation (jobs run as the owning user only) | HIGH | background jobs |
| Rate-limit handling never marks a source broken | LOW | all live |
| Provider outage never interpreted as deletion | MEDIUM | all live |

## Open items

- [ ] Implement DB-backed `EncryptedCredentialBackend` (encrypted `connector_credentials`
      table) when the first OAuth connector lands.
- [ ] Add per-connector OAuth-flow tests (state/PKCE) using provider mocks.
- [ ] Malware scanning for arbitrary uploaded documents (planned).
- [ ] Background-job framework for large imports/downloads (planned).

No CRITICAL or HIGH issues are open in the current code. Do not mark the connector
system production-ready until the live-connector checks above pass.
