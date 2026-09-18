# Digital Life Archive — Master Product & Build Specification

Version: 1.0
Date: 2026-09-18
Status: Initial build specification

---

# 1. YOUR ROLE

You are the lead software architect and senior full-stack developer for this project.

You are building a consumer-facing digital archive platform.

You are responsible for:

- architecture
- database design
- frontend
- backend
- Supabase
- connector architecture
- security
- privacy-by-design
- automated testing
- documentation
- CI/CD preparation
- maintainability

Do not blindly implement this specification.

Before every major phase:

1. Analyse the requirements.
2. Inspect the existing repository.
3. Identify risks and dependencies.
4. Propose an implementation plan.
5. Check whether assumptions about third-party APIs are verified.
6. Implement only after the architecture is internally consistent.
7. Test the implementation.
8. Update documentation.
9. Commit work in logical units.

If an instruction in this document would create a security, privacy, reliability or architectural problem, document the problem and choose the safer architecture.

Never invent capabilities for external services.

---

# 2. PRODUCT VISION

Build a digital life archive for consumers.

The core promise is:

> Connect the places where your digital life already exists once. The platform archives your existing history and then continues preserving new content automatically. Your archive remains independent of the original platforms and can eventually be passed to people you choose.

This is NOT primarily another Dropbox, Google Drive or cloud-storage service.

The product performs four functions:

COLLECT → PRESERVE → ORGANISE → PASS ON

The archive can eventually contain: photos, videos, documents, social-media content, posts, audio, memories, metadata, personal stories.

Possible sources include: Apple Photos, Google Photos, Google Drive, OneDrive, Dropbox, Instagram, Facebook, TikTok, Snapchat, X, local files, mobile devices.

Not every connector is technically available today. Never pretend otherwise.

---

# 3. PRIMARY PRODUCT PRINCIPLE

The consumer must not need technical knowledge.

The ideal connector experience is: select source logo → click "Connect" → authenticate at provider → grant permission → return to application → done.

Never expose technical terminology such as: API, OAuth, refresh token, webhook, delta cursor, portability job, access token, cron, sync worker.

Translate technical states into human language.

- BAD: "OAuth refresh token invalid_grant."
- GOOD: "Google Drive needs your permission again. Your archived files are safe. Reconnect Google to continue protecting new files."

---

# 4. CORE ARCHIVE PRINCIPLE

Once content has successfully entered the archive: SOURCE DELETION MUST NEVER AUTOMATICALLY DELETE THE ARCHIVED COPY.

Record that the source copy disappeared, but do not remove the archive object. Source deletion and archive deletion are completely separate events.

---

# 5. EXISTING HISTORY FIRST

When a source is connected, first attempt to discover and archive the complete accessible historical dataset.

The promise is: "We will first protect what you already have."

Workflow: CONNECT → DISCOVER → INITIAL ARCHIVE → CONTINUOUS ARCHIVE

---

# 6. CONTINUOUS ARCHIVING

After initial archive completion, automatically check for new or changed content. Default DAILY; user options daily/weekly/monthly.

Prefer incremental retrieval (delta APIs, cursors, timestamps, webhooks, change tokens, incremental exports). All archive jobs must be idempotent. Retrying a job must never create duplicate archive records.

---

# 7. PRODUCT LANGUAGE

Initial market is Dutch consumers. Build localisation-ready from day one. Initial languages: nl-NL, en. Dutch is default. Do not hardcode UI strings. Use an internationalisation architecture. Prefer reassuring language ("Veiliggesteld", "Bijgewerkt", "Actie nodig", "Bron koppelen").

---

# 8. TECHNOLOGY STACK

Frontend: Next.js, React, TypeScript. Styling: Tailwind CSS. Backend/data: Supabase (PostgreSQL, auth, RLS, database, metadata, Edge Functions, Realtime, initial storage). Repository: GitHub. CI: GitHub Actions. Package manager: pnpm. Prefer a monorepo.

---

# 9. IMPORTANT STORAGE REQUIREMENT

Do NOT tightly couple archive storage to Supabase Storage. Create a storage abstraction `ArchiveStorageProvider` with put/get/stream/exists/delete/getMetadata/createSignedAccess/verifyIntegrity. Initial implementation may use Supabase Storage. Business logic must not depend directly on Supabase-specific storage APIs. The provider must be replaceable.

---

# 10. REPOSITORY STRUCTURE

```
/apps/web
/apps/mobile-placeholder
/packages/{ui,database,connectors,archive,storage,security,shared,i18n}
/supabase/{migrations,functions,seed}
/docs/{architecture,database,connectors,security,privacy,storage,decisions,api}.md
/tests/fixtures
CLAUDE.md
README.md
```

Do not create a mobile application yet. Reserve architecture for it.

---

# 11. GIT WORKFLOW

Never work directly on main for feature development. Use main, develop, feature/*, fix/*, security/*. Branch → implement → test → document → PR. Do not commit secrets, API keys, production credentials, personal data, real photos, real exported social archives.

---

# 12. ENVIRONMENT MANAGEMENT

Create `.env.example`. Never commit `.env`, `.env.local`, production secrets. Validate required environment variables at application startup; fail clearly if missing. Never expose Supabase service-role credentials to the browser.

---

# 13. AUTHENTICATION

Initial auth: email, Google, Apple where feasible. Design for MFA and passkeys. Do not weaken security for onboarding convenience. Secure session defaults.

---

# 14. ONBOARDING

After registration show "Welkom — Waar staat jouw digitale leven?" with source cards grouped PHOTO/VIDEO, SOCIAL, DOCUMENTS. Each source shows a capability state. Never show "Connect" if no legitimate automatic connector exists. Actions: "Koppelen", "Importeren", "Binnenkort", "Opnieuw verbinden".

---

# 15. CONNECTOR CAPABILITY REGISTRY

Implement a connector capability registry. Every connector declares capabilities: connector_key, display_name, category, historical_import, incremental_sync, automatic_sync, webhooks, oauth, authorization_expiry, deletions_detectable, original_media_available, metadata_available, archive_import_supported, requires_provider_approval, implementation_status.

Statuses: research, verified, development, provider_approval, beta, production, disabled.

Never infer external API capabilities from assumptions. A connector may only be marked `verified` after confirmation against current official provider documentation or tested behaviour. Document verification source/date in docs/connectors.md.

---

# 16. CONNECTOR TYPES

- TYPE A — LIVE CONNECTOR: connect → authenticate → initial archive → incremental archive (potentially Google Drive, OneDrive, Dropbox).
- TYPE B — DATA PORTABILITY CONNECTOR: request export → provider prepares → webhook/poll → retrieve → process → archive. Do not implement until verified.
- TYPE C — ARCHIVE IMPORTER: fallback; user uploads an export ZIP, app extracts supported media and metadata.

---

# 17. CONNECTOR INTERFACE

Strongly typed `ArchiveConnector`: connect, disconnect, validateConnection, discover, initialImport, getChanges, importChanges, refreshAuthorization, getStatus. Separate provider authentication from archive ingestion. Do not make archive logic provider-specific.

---

# 18. FIRST REAL CONNECTOR

Google Drive as first production-grade proof-of-concept, subject to current API verification. Golden path: Google auth → permission → discover → count → queue jobs → download → checksum → archive → metadata → complete. Then detect later changes incrementally where officially supported.

---

# 19. MOCK CONNECTOR

Before relying on external services, implement a `MockArchiveConnector` simulating 100 photos, 20 videos, 30 documents, new content, modified content, source deletion, auth expiry, temporary provider error, retry, rate limiting.

---

# 20. ARCHIVE ENGINE

Provider-independent Archive Engine pipeline: DISCOVER → FETCH → VALIDATE → CHECKSUM → DEDUPLICATE → STORE ORIGINAL → STORE METADATA → INDEX → CONFIRM INTEGRITY. Never mark archived until durable storage AND database metadata are both confirmed. Design failure recovery carefully.

---

# 21. ARCHIVE ITEM

Generic `archive_items` model (UUIDs): id, owner_id, type (photo/video/document/post/message/audio/other), original_filename, mime_type, file_size, checksum_sha256, created_at_source, modified_at_source, archived_at, storage_provider, storage_key, metadata_json, status, created_at, updated_at.

---

# 22. SOURCE REFERENCES

`archive_item_sources`: id, archive_item_id, connector_account_id, source_item_id, source_url_if_safe, source_created_at, source_modified_at, source_deleted_at, metadata_json. Do not store multiple physical copies if the original binary is cryptographically identical. Preserve all source relationships.

---

# 23. DEDUPLICATION

MVP: SHA-256 exact binary deduplication. Later: perceptual hashing. Never auto-delete based only on AI/perceptual similarity. Exact hash match may deduplicate storage while retaining source records.

---

# 24. CONNECTED ACCOUNTS

`connector_accounts`: id, user_id, connector_key, provider_account_identifier, display_name, status, connected_at, last_successful_archive_at, last_attempt_at, authorization_expires_at, archive_frequency, cursor_state_encrypted, created_at, updated_at. Sensitive provider credentials must not be stored as plaintext. Design token encryption separately.

---

# 25. ARCHIVE FREQUENCY

Values daily/weekly/monthly, default daily. Scheduling backend-controlled; the browser must not need to remain open.

---

# 26. JOB SYSTEM

Persistent `archive_jobs`: id, user_id, connector_account_id, job_type (discovery/initial_import/incremental_import/export/integrity_check), status (queued/running/completed/failed/retrying/cancelled), scheduled_at, started_at, completed_at, items_discovered, items_processed, items_archived, items_skipped, items_failed, bytes_processed, retry_count, error_code, safe_error_message, created_at, updated_at. Never store sensitive content in error logs.

---

# 27. RETRIES

Exponential backoff. Differentiate temporary error, authentication error, rate limit, permanent item error, provider outage, internal error. Authentication failure → ACTION_REQUIRED, not endless retries.

---

# 28. DASHBOARD

Consumer-friendly. Show total "herinneringen" with breakdown (foto's/video's/documenten/overige) and per-source status. Primary action "+ Bron koppelen". Do not overload with technical metrics.

---

# 29. SOURCE DETAIL PAGE

Show source, status, items archived, storage represented, first archive date, last successful archive, next planned check. Controls: archive frequency, reconnect, disconnect, archive now. Disconnecting a source DOES NOT delete archived content — explain clearly.

---

# 30. ARCHIVE NAVIGATION

Vandaag, Mijn leven, Foto's, Video's, Documenten, Social, Personen, Plaatsen, Bronnen, Familie, Instellingen. Some sections may be placeholders. Do not implement complex AI before core archiving works.

---

# 31. ARCHIVE BROWSER

MVP: grid/list, pagination/infinite loading, date filters, source filter, type filter, basic search, detail view, download original. Never load full-resolution originals unnecessarily; generate previews/thumbnails separately.

---

# 32. ORIGINAL FILE PRINCIPLE

Originals are immutable. Derived assets (thumbnail, preview, OCR, embeddings, transcoding, metadata) never overwrite original binary data.

---

# 33. DOCUMENT VAULT

Categories: identity, housing, insurance, financial, testament, contract, education, tax, medical, other. Classification is metadata; never move/modify the original. Sensitive categories get additional access controls later.

---

# 34. SEARCH

MVP: filename, date, source, type, basic metadata. Architecture supports future semantic search. Do not require AI for basic archive operation.

---

# 35. AI LAYER

AI is optional intelligence ABOVE the archive; never required for reliable preservation. Do not send private archive content to third-party AI without explicit architecture, consent and privacy review. Do not use customer content for model training by default.

---

# 36. MY LIFE

Future chronological timeline ("Mijn leven"). Events may be suggested automatically; users remain in control. Not P0.

---

# 37. FAMILY

Design DB for multiple family members. Do not fully implement complex family permissions in MVP. A person and an application user are not necessarily the same entity — model this distinction carefully.

---

# 38. DIGITAL LEGACY

Future "Als mij iets overkomt" section. Users designate trusted people. DO NOT implement automatic inheritance or death-triggered access in MVP. Architecture only. Production legacy transfer requires separate legal review, identity verification, security review, fraud prevention, recovery process.

---

# 39. LEGACY SAFETY PRINCIPLE

Never implement "someone reports user dead → grant access." Future flow needs multiple safeguards (notification → identity verification → evidence → notify trusted parties → waiting period → challenge/cancellation → final verification → controlled access). NOT MVP.

---

# 40. FULL EXPORT

No vendor lock-in. "Download mijn volledige archief" preserves originals in a portable package (photos/videos/documents/social/audio + metadata/archive.json + README.txt). Use asynchronous export jobs for large archives. Never require a proprietary format.

---

# 41. ACCOUNT DELETION

Explicit and protected. Disconnecting sources != deleting account. Deleting account != immediate silent destruction. Design safe confirmation and legally appropriate deletion workflow. MVP at minimum supports a documented deletion request process.

---

# 42. SECURITY — P0

Security is not a later feature. Minimum: TLS, secure auth, MFA-ready, passkey-ready, RLS, least privilege, signed storage URLs + short expiry, input validation, rate limiting, audit logging, secure token handling, secret management, dependency scanning, secure headers, CSRF where applicable, XSS/SQLi protection, upload validation. Plan malware scanning for uploaded files.

---

# 43. ROW LEVEL SECURITY

Supabase RLS DEFAULT DENY. Users may only access their own data. Every user-data table requires RLS enabled, explicit policies, tests. Never rely solely on frontend filtering.

---

# 44. SERVICE ROLE

Service-role credentials must NEVER appear in the browser bundle, public env vars, client-side JS, or Git. Privileged operations run server-side only.

---

# 45. PROVIDER TOKEN SECURITY

OAuth/provider credentials are extremely sensitive. Do not store refresh tokens as plaintext. Documented token encryption strategy. Separate provider credentials from ordinary application data. Design for key rotation, revocation, expiry, auditability. Do not log tokens.

---

# 46. ADMIN PRIVACY

Administrators must NOT automatically access personal archive content. Support tooling exposes operational information (connector status, job ID, failure type, last archive, storage integrity), not personal content. Exceptional access requires explicit reason, strong authorisation, audit logging, limited duration.

---

# 47. AUDIT LOG

`security_audit_events`: login, logout, connector_connected/disconnected/reauthorised, archive_export_requested/downloaded, account_deletion_requested, security_setting_changed. Never log private content.

---

# 48. GDPR / AVG

Design for GDPR from the beginning: data minimisation, purpose limitation, consent, revocation, export, deletion, retention policies, processor documentation, EU processing where possible, privacy by design. Do not make marketing claims ("100% private", "unhackable", "fully encrypted", "zero knowledge") unless technically proven.

---

# 49. OBSERVABILITY

Every import has a traceable ID (e.g. IMP-20260918-98374). Track stages internally. Logs must not contain photo/document contents, tokens, passwords, private message text.

---

# 50. HEALTH STATUS

Internal archive health; consumer-facing states SAFE / ACTION_REQUIRED / ARCHIVING / TEMPORARY_PROBLEM translated to Dutch ("Alles veilig", "Bezig met veiligstellen", "Actie nodig", "We proberen het later opnieuw").

---

# 51. ERROR UX

Never show raw stack traces or provider errors to consumers. Map technical errors to safe messages. Keep technical details in protected operational logs.

---

# 52. ACCESSIBILITY

Target WCAG 2.2 AA: keyboard navigation, focus states, semantic HTML, screen-reader labels, contrast, reduced motion, accessible forms, error descriptions. Accessibility is an acceptance criterion.

---

# 53. RESPONSIVE DESIGN

Works well on mobile, tablet, desktop. Mobile-first. Primary interaction is frequently on a phone.

---

# 54. DESIGN DIRECTION

Trustworthy, calm, human, simple, premium, non-technical. Avoid cybersecurity clichés, hacker imagery, complex dashboards, enterprise UI, crypto aesthetics, fear-based death messaging. The product is about preserving life and memories, not dying.

---

# 55. TESTING STRATEGY

Unit, integration, database/RLS, connector contract, end-to-end tests. Critical archive logic requires tests before production use.

---

# 56. SYNTHETIC TEST DATA ONLY

Never commit actual personal data. Create synthetic fixtures (`/tests/fixtures/mock-*`). Generated photos/documents contain no real personal information.

---

# 57. CI

GitHub Actions: install, lint, typecheck, unit tests, integration tests where practical, build, security/dependency checks. PRs should not merge if critical checks fail.

---

# 58. DOCUMENTATION

Keep current: docs/architecture.md, database.md, connectors.md, security.md, privacy.md, storage.md, decisions.md. Record meaningful decisions as ADRs. Document WHY, not only WHAT.

---

# 59. DO NOT BUILD YET

Without explicit later approval: password manager, blockchain, cryptocurrency, automatic inheritance, automatic death detection, biometric identity, social-media scraping, provider ToS workarounds, unsupported private APIs, custom AI model, facial recognition, complex billing, native mobile app, permanent-storage financial products.

---

# 60. MVP DEFINITION

MVP P0: repository foundation, Next.js app, TypeScript, Tailwind, i18n, Supabase integration, authentication, onboarding, connector registry, mock connector, archive engine, storage abstraction, archive metadata model, SHA-256 dedup, job architecture, scheduler architecture, daily/weekly/monthly frequency, dashboard, source detail page, archive browser, original download, file upload, basic export architecture, RLS, audit logging, tests, CI, documentation. First external connector: Google Drive, only after current official API capabilities verified.

---

# 61. P1

OneDrive, Dropbox, Apple/iOS architecture + PoC, TikTok portability investigation, Google Photos portability, Facebook/Instagram archive importers, improved exports, document vault. Each external connector requires independent verification.

---

# 62. P2

Additional Meta automation where supported, Snapchat/X importers, semantic search, AI timeline, people, places, events, family archive, legacy workflow, native apps, subscriptions.

---

# 63. BUILD PHASES

- PHASE 0 — Repository & architecture (this phase).
- PHASE 1 — Supabase foundation (migrations, profiles, registry, accounts, items, sources, jobs, audit; RLS immediately).
- PHASE 2 — Auth & application shell.
- PHASE 3 — Onboarding.
- PHASE 4 — Mock connector.
- PHASE 5 — Storage & archive engine.
- PHASE 6 — Job system.
- PHASE 7 — Dashboard.
- PHASE 8 — Archive browser.
- PHASE 9 — Google Drive connector (verify official docs first).
- PHASE 10 — File upload & archive import framework.
- PHASE 11 — Export.
- PHASE 12 — Security hardening.
- PHASE 13 — MVP validation.

---

# 64. IMPORTANT DEVELOPMENT RULE

At the beginning of EACH phase output a concise plan: GOAL, FILES/COMPONENTS AFFECTED, DATABASE CHANGES, SECURITY IMPACT, TEST PLAN, RISKS. Then implement. After each phase output: WHAT WAS BUILT, TEST RESULTS, SECURITY NOTES, KNOWN LIMITATIONS, NEXT PHASE.

Do not repeatedly ask questions resolvable via this spec or standard engineering judgement. Do ask before decisions that materially change privacy, security, business model, consumer promise, data retention, external provider behaviour, legacy access, or architecture at major scale.

---

# 65–67. GOLDEN PATH ACCEPTANCE TESTS

- Golden path (happy): new user → account → onboarding → Google Drive → auth → permission → return → "gekoppeld" → discover history → count → initial archive → close browser → backend continues → "veiliggesteld" → new file auto-archived → source deletion keeps archived copy → download original → export contains originals + portable metadata.
- Failure path: connection expires → scheduled archive fails auth → existing archive untouched → ACTION_REQUIRED → "Opnieuw verbinden" → resume. No archived data lost.
- Source disappears: provider outage → archive retains files → never infer deletion from unavailability → reconcile safely on return.

---

# 68. DATA INTEGRITY

Store cryptographic checksums (SHA-256). Design periodic integrity verification (expected vs actual). Corruption must be detectable. No destructive automatic repair without a verified second copy.

---

# 69. LONG-TERM ARCHITECTURE

Design for eventual scale (1k → 1M users) without premature over-engineering. Archive jobs must not depend on one web server process.

---

# 70. PRODUCT KPI

TIME TO SAFETY (target: under 10 minutes for several sources) and USER MAINTENANCE REQUIRED (target: near zero).

---

# 71. BUSINESS PRINCIPLE

Compete on continuity, simplicity, independence, preservation, family value, portability, trust — not cheapest gigabytes.

---

# 72. USER TRUST

Never claim safely archived before actually stored and verified. Use "Bezig met veiligstellen" until storage and integrity checks succeed.

---

# 73. PLATFORM INDEPENDENCE

The archive must survive provider API changes, account deletion, source deletion, outages, connector removal. Archived content remains usable independently.

---

# 74. PROVIDER ETHICS & TERMS

Never scrape private platforms, ask for provider passwords, circumvent access restrictions, reverse engineer private APIs for production, bypass rate limits, or pretend unsupported functionality exists. Use official APIs, official data portability, official exports, device permissions, user-supplied archives. Document limitations.

---

# 75. DEFINITION OF DONE

Implemented, typed, tested, secure, RLS considered, accessible, responsive, localised, errors handled, documented, CI passing. External connectors additionally: capabilities verified, provider limitations documented, failure behaviour tested.

---

# 76. STARTING INSTRUCTION

Begin with PHASE 0 only. Inspect repo, read this file, summarise product understanding in docs/architecture.md, identify risks, propose structure, create the development foundation, configure lint/TypeScript/tests/CI, create .env.example, create initial documentation, verify a clean build. Then STOP. Do not begin Phase 1 until explicitly instructed.

---

# FINAL PRINCIPLE

Always optimise for: "I connected it once. My digital life is being protected. I don't have to understand how it works." Everything behind that sentence may be technically complex; the user should never experience that complexity.
