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
