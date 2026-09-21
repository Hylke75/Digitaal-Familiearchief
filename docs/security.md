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
  of structured logs (§49). CI runs `pnpm audit` (high/critical fails the build); see
  [Dependency policy](#dependency-policy-pnpm-audit).

## Archive write path (intentional SECURITY DEFINER)

Authenticated users cannot `INSERT` into `archive_items` directly (no write
policy). The only write path is the vetted `archive_ingest_item` RPC — a
`SECURITY DEFINER` function that (a) requires `auth.uid()`, (b) verifies the
target `connector_account` belongs to the caller, and (c) dedups on checksum.
This keeps arbitrary-row fabrication impossible (§44 intent) while avoiding a
service-role key in the app. Supabase's linter flags it as an authenticated-
executable definer function; that is **expected and reviewed** here. Storage
originals live in a private bucket with per-user folder RLS; downloads use
short-lived signed URLs.

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

## Dependency policy (`pnpm audit`)

CI fails on **high** and **critical** advisories (`.github/workflows/ci.yml`,
job `security`). Moderate and low are reported but do not block.

Keeping the gate meaningful requires that it be green: a permanently red audit
trains everyone to ignore it. Two mechanisms keep it honest.

**1. Overrides** (`pnpm.overrides` in the root `package.json`) pull patched
versions of transitive dependencies that the direct dependency has not yet
picked up:

| Override | Reason |
| --- | --- |
| `postcss: ^8.5.18` | `next` still resolves `postcss@8.4.31`; patches GHSA-6g55-p6wh-862q and GHSA-r28c-9q8g-f849 (build-time source-map path traversal). |
| `glob: ^10.5.0` | Reached via `eslint-config-next`; patches GHSA-5j98-mcp5-4vw2 (CLI command injection, dev-only). |
| `vite: ^6.4.3` | Reached via `vitest`; patches GHSA-fx2h-pf6j-xcff (`server.fs.deny` bypass, dev-only, Windows). |

**2. Documented exceptions** (`pnpm.auditConfig.ignoreGhsas`). Every entry is a
Next.js advisory whose only published fix is a **Next 15.x** release. The app
runs Next 14 (`14.2.35`, the latest 14 patch), so no upgrade path exists short
of the Next 15 migration, which is planned as a separate project.

| Advisory | Patched in | Exposure in this app |
| --- | --- | --- |
| GHSA-p293-qw3h-jr36 (critical) | 15.5.24 | RCE on Windows hosts only — production runs on Linux (Vercel). |
| GHSA-2xp9-vwfh-vxw4 (critical) | 15.5.24 | Image Optimization RCE — `next/image` is not used and no `images.remotePatterns`/`domains` are configured. |
| GHSA-36qx-fr4f-26g5 | 15.5.16 | Pages Router middleware bypass — App Router only. |
| GHSA-p9j2-gv94-2wf4 | 15.5.21 | SSRF via `rewrites` — no `rewrites()` are configured. |
| GHSA-c4j6-fc7j-m34r | 15.5.16 | SSRF in App Router. Residual risk; mitigated by the strict `middleware.ts` matcher. |
| GHSA-89xv-2m56-2m9x | 15.5.21 | SSRF in Server Actions. Residual risk. |
| GHSA-h25m-26qc-wcjf | 15.0.8 | Request-deserialisation DoS. Residual risk; Vercel absorbs request-level abuse. |
| GHSA-q4gf-8mx6-v5v3 | 15.5.15 | Server Components DoS. Residual risk. |
| GHSA-8h8q-6873-q5fj | 15.5.16 | Server Components DoS. Residual risk. |
| GHSA-m99w-x7hq-7vfj | 15.5.21 | Server Actions DoS. Residual risk. |

Four DoS/SSRF advisories are genuine residual risk, accepted until the Next 15
migration. **The exception list is temporary**: it is deleted in full as part of
that migration, and no advisory outside these ten is ever added without the same
written justification.

## Roadmap (later phases)

MFA + passkeys (auth), signed short-lived storage URLs, upload validation +
malware scanning, rate limiting, CSRF where applicable, and the Phase 12 review.
