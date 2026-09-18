# Security

_Status: Phase 0 — baseline foundations. A dedicated review lands in Phase 12
(`docs/security-review-v1.md`)._

Security is a P0 concern, not a later feature (CLAUDE.md §42).

## Boundaries established in Phase 0

- **Environment validation** (`apps/web/lib/env.ts`): public (`NEXT_PUBLIC_*`) and
  server-only config are validated by **separate** zod schemas. The server schema
  (service-role key, token encryption key) throws if read in the browser, so the
  service-role key can never leak into a client bundle (§44). Missing required
  config fails fast (§12).
- **RLS-first**: the browser uses only the anon/publishable key; Row Level
  Security (default-deny) is the boundary, never frontend filtering (§43). RLS
  policies + tests are added with the schema in Phase 1.
- **Secure headers** (`next.config.mjs`): `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS. A
  strict CSP is extended per-connector in later phases.
- **Secret hygiene**: `.env*` is gitignored (only `.env.example` is committed).
  `@dla/security#redactSecrets` keeps tokens/passwords/authorization/cookies out
  of structured logs (§49). CI runs `pnpm audit` (high/critical fails the build).

## Provider token security (§45)

Provider OAuth/refresh tokens are extremely sensitive. They are:
encrypted at rest via the `TokenEncryption` interface (scheme tag enables key
rotation), stored separately from ordinary application data, never logged, never
plaintext. Concrete implementation + key management lands with the first real
connector.

## Admin privacy (§46)

Administrators do **not** automatically get access to personal archive content.
Support tooling exposes operational data (connector status, job id, failure type,
last successful archive, storage integrity) — not photos/documents. Any future
exceptional access requires explicit reason, strong authorisation, audit logging
and limited duration.

## Audit logging (§47)

`security_audit_events` records login/logout, connector connect/disconnect/
reauthorise, export requested/downloaded, account-deletion requested, and
security-setting changes. Never private content.

## Roadmap (later phases)

MFA + passkeys (auth), signed short-lived storage URLs, upload validation +
malware scanning, rate limiting, CSRF where applicable, and the Phase 12 review.
