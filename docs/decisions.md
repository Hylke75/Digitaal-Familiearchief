# Decision log (ADRs)

Lightweight architecture decision records. Document **why**, not only what
(CLAUDE.md §58).

---

## ADR-0001 — pnpm monorepo with a domain-package split
**Date:** 2026-09-18 · **Status:** Accepted (Phase 0)

**Context.** The archive domain must not depend on Supabase specifics or any
single provider (§9, §17), and multiple surfaces (web now, mobile later, emails)
will share types and copy.

**Decision.** Use a pnpm workspace with `apps/*` and `packages/*`. Domain lives in
provider-agnostic packages (`archive`, `storage`, `connectors`, `security`,
`shared`, `i18n`); `apps/web` composes them. Packages ship TypeScript source and
are compiled by Next via `transpilePackages`.

**Consequences.** Compile-time boundaries enforce independence; no separate build
step per package in Phase 0. Cross-package types resolve via tsconfig paths.

---

## ADR-0002 — Storage behind an interface from day one
**Date:** 2026-09-18 · **Status:** Accepted

**Context.** Archive may reach TB–PB; Supabase Storage is a starting point (§9).

**Decision.** All archive logic depends on `ArchiveStorageProvider`. Phase 0 ships
only an in-memory reference implementation; Supabase adapter comes in Phase 5.

**Consequences.** Backend is replaceable without touching the domain. Content
addressing (`owner + sha256`) gives idempotency and dedup for free.

---

## ADR-0003 — Honest connector capability registry drives the UI
**Date:** 2026-09-18 · **Status:** Accepted

**Context.** External APIs are unverified and change; the product must never fake
a connector (§3, §15).

**Decision.** A typed registry declares capabilities and an `implementationStatus`.
Onboarding actions are derived from it. Only `production` connectors can be offered
as live; external providers stay `research` until Phase 9 verification. A test
asserts no external provider is `production` and that verified/production entries
carry provenance.

**Consequences.** Impossible to accidentally start a fake OAuth flow. Verification
is a deliberate, documented gate.

---

## ADR-0004 — Localisation via next-intl fed from @dla/i18n (no URL routing yet)
**Date:** 2026-09-18 · **Status:** Accepted

**Context.** nl-NL default + en, localisation-ready from day one, no hardcoded
strings (§7).

**Decision.** Dictionaries live in `@dla/i18n` (single source of truth). The app
uses `next-intl` with a request config that resolves locale from a cookie then
Accept-Language then the Dutch default. URL-prefixed routing is deferred until it
is actually needed. A type-level `Widen` guarantees every locale is structurally
complete.

**Consequences.** Copy is centralised and reusable; switching to routed locales
later is localized to the app.

---

## ADR-0005 — Explicit public/server env split; RLS is the security boundary
**Date:** 2026-09-18 · **Status:** Accepted

**Context.** Service-role must never reach the browser (§44); RLS default-deny is
the real boundary (§43).

**Decision.** `lib/env.ts` validates public and server config separately; the
server schema refuses to run in the browser. The browser client uses only the
anon/publishable key.

**Consequences.** Fail-fast on misconfiguration; a clear, testable trust boundary.

---

## ADR-0006 — Supabase project region eu-central-1 (Frankfurt)
**Date:** 2026-09-18 · **Status:** Accepted

**Context.** GDPR/AVG prefers EU processing (§48).

**Decision.** Create the Supabase project in eu-central-1.

**Consequences.** EU data residency for database, auth and initial storage.

## ADR-0007 — Hardening round: audit trail, rate limiting, CSP, signed-URL TTL

**Date:** 2026-09-23 · **Status:** Accepted

**Context.** A broad review surfaced gaps against §42/§47: `security_audit_events`
existed but was never written, there was no rate limiting, no `Content-Security-Policy`
header (despite a comment claiming one), and thumbnail signed URLs lived for 24h.

**Decision.**
- Audit trail via an owner-scoped `SECURITY DEFINER` `audit_log` RPC (migration
  0013), called best-effort so auditing never breaks a user flow. Events: login,
  logout, export requested, connector connected/reauthorised/disconnected.
- In-memory fixed-window rate limiter as a per-instance backstop on the export
  route, all mobile endpoints, and the OAuth callback. A shared store (Upstash)
  is the later upgrade behind the same call sites.
- Real CSP derived from `NEXT_PUBLIC_SUPABASE_URL` (img/media/connect scoped to
  the Supabase origin incl. `wss:`); `'unsafe-inline'` on script-src stays until
  Next.js inline bootstrap moves to nonces.
- Thumbnail/preview signed-URL TTL cut from 24h to 4h; downloads stay at 60s.

**Consequences.** The audit table is now populated where it matters; abusive
bursts are throttled; a copied thumbnail URL grants hours, not a day. No verified
issue was found for token encryption (`AesGcmTokenEncryption` already ships) or
credential cascade (`on delete cascade` already present) — both were false alarms
and left unchanged.

## ADR-0008 — Document first-page previews rendered at seed time (demo)

**Date:** 2026-09-23 · **Status:** Accepted

**Context.** PDFs can't be rendered by the on-the-fly image transform, so a
first-page preview needs pre-rendering. `pdfjs`-in-node renders non-embedded
standard fonts unreliably (blank pages); a serverless renderer would need native
`@napi-rs/canvas` + font tracing on Vercel = deploy risk.

**Decision.** Render document previews locally at seed time via macOS Quick Look
(system PDFKit — perfect fonts), store them as a `preview` derivative, and let the
owner register it through a new owner-scoped `archive_register_derivative` RPC
(migration 0011). Runtime never renders; there is no new runtime dependency.

**Consequences.** Demo documents show authentic first pages with zero serverless
deploy risk. Production user-uploaded PDFs keep the metadata card + searchable
text until a serverless renderer is justified.
