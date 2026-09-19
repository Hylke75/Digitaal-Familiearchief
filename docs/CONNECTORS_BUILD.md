# Master Connector Build Specification — Digital Life Archive

_Authoritative specification for the Source Connection System. Read together with
`CLAUDE.md` (product + tech) and `docs/DESIGN.md` (UX/UI). Never fake a connector;
verify current official provider documentation before implementing._

The most important consumer promise:

> "I connect a source once. My existing digital history is archived, and afterwards
> new content is preserved automatically whenever the source technically allows it."

The user must NOT need technical knowledge and must never see: OAuth, APIs, tokens,
refresh tokens, portability, delta links, cursors, webhooks, archive jobs, scopes,
API limits.

## 1. Primary UX goal

For every source where official provider functionality allows it: see logo →
click "Koppelen" → provider auth → grant → return → "✓ [Platform] is gekoppeld" →
auto discovery → historical archive → close browser → backend continues →
periodic automatic checks. A non-technical consumer must connect a supported
source without instructions.

## 2. Never fake a connector (critical)

Never pretend an external provider supports functionality it does not. Never
scrape, store provider passwords, reverse engineer private APIs, browser-automate
providers, bypass access controls, use undocumented production APIs, or falsely
show "automatic" when only manual export exists. For every connector, verify
CURRENT official documentation and record it in `docs/connectors/<provider>.md`
(verification date, official URLs, auth mechanism, scopes, historical/incremental/
background access, refresh behaviour, deletion detection, metadata/media
availability, rate limits, app/security review requirements, known restrictions,
recommended implementation).

## 3. Target sources

Photo/device: Apple/iCloud Photos, Google Photos, local upload, future Android
backup. Document clouds: Google Drive, OneDrive, Dropbox. Social: Instagram,
Facebook, TikTok, Snapchat, X. Archive import: Google Takeout, Meta archive,
Snapchat My Data, X Archive, generic ZIP, local folders. Architecture must make
adding future connectors (Threads, LinkedIn, Pinterest, Flickr, Amazon Photos,
Box, iCloud Drive, WhatsApp exports, …) easy. Do not hardcode around the current list.

## 4. User-facing source screen

Route `/sources` (here `/bronnen`), title "Bronnen", subtitle "Hier verzamelen we
jouw digitale leven." Groups: "Foto's en video's", "Sociale media", "Documenten".
Each card shows ONE registry-driven action: Koppelen / Importeren / Selecteren /
Opnieuw verbinden / Binnenkort. Never hardcode misleading buttons.

## 5. Simple connection language

Dutch by default, human, non-technical. "Google Drive koppelen" not "Authorize
OAuth scopes"; "Google heeft opnieuw je toestemming nodig" not "Refresh token
expired"; "We controleren iedere dag automatisch op nieuwe bestanden" not
"Incremental polling every 24h".

## 6. Connection success screen

"✓ [Platform] is gekoppeld" → "Even kijken wat we voor je kunnen veiligstellen…"
→ "N bestanden gevonden" with a useful breakdown → CTA "Naar mijn archief".
Archiving starts automatically; no extra technical confirmation.

## 7. Archive schedule

After the initial historical archive, auto-check for new content: DAILY (default),
WEEKLY, MONTHLY. Respect provider limits via a `minimum_sync_interval` capability;
never schedule more frequently than allowed. Webhooks process quickly but always
run periodic reconciliation.

## 8. Core rule: source deletion

SOURCE DELETE ≠ ARCHIVE DELETE. On source disappearance set `source_deleted_at`
but retain the archived item. Only the user may explicitly remove the independent
archive copy. Enforce at the archive-domain level, not merely in the UI.

## 9. Connector status model

Internal: NOT_CONNECTED, CONNECTING, AUTHORIZING, CONNECTED, DISCOVERING,
INITIAL_ARCHIVE, ARCHIVING, HEALTHY, TEMPORARY_ERROR, ACTION_REQUIRED,
AUTHORIZATION_EXPIRED, MANUAL_IMPORT_AVAILABLE, PROVIDER_APPROVAL_REQUIRED,
UNAVAILABLE, DISCONNECTED. Map to consumer language: Niet gekoppeld / Bezig met
koppelen / Bezig met veiligstellen / Alles veilig / We proberen het later opnieuw /
Actie nodig / Toestemming nodig / Importeren / Binnenkort.

## 10. Connector capability registry

Strongly typed. Each connector defines: key, name, category, logo, description;
`connection_type` (LIVE_API | PORTABILITY_API | DEVICE_NATIVE | USER_PICKER |
GUIDED_EXPORT | ARCHIVE_IMPORT | UNAVAILABLE); capabilities (historical_import,
incremental_import, automatic_background_import, webhook_support, manual_refresh,
source_deletion_detection, original_media, metadata, folders_or_albums,
provider_account_identity); authorization (oauth, authorization_duration,
refresh_supported, reauthorization_required, provider_review_required,
security_review_required); scheduling (supports_daily/weekly/monthly,
minimum_sync_interval); implementation (research | verified | development |
provider_approval | beta | production | disabled). UI may never promise a
capability the registry marks false.

## 11. Standard connector contract

Provider-independent interface: getCapabilities, beginConnection, handleCallback,
validateConnection, disconnect, discover, startInitialArchive, getChanges,
archiveChanges, refreshAuthorization, getConnectionHealth. Use explicit capability
checking instead of fake no-op methods.

## 12. Provider account model

`connector_accounts`: id, user_id, connector_key, provider_user_id,
provider_display_name, status, connection_type, connected_at,
authorization_expires_at, last_successful_archive_at, last_archive_attempt_at,
next_archive_at, archive_frequency, cursor_reference, provider_metadata, created/updated_at.
Do NOT store sensitive credentials in provider_metadata.

## 13. Token security

Never store plaintext refresh tokens, expose them to browser JS, or log them.
Server-side envelope encryption with key rotation; encryption key outside the
database; design for cloud KMS/HSM. Provide `ProviderCredentialStore`
(save/retrieve/rotate/revoke/delete). App code never reads token columns directly.

## 14. OAuth security

PKCE where supported; validate state; secure redirect URIs; CSRF prevention;
server-side callback handling; short-lived session state; least privilege scopes;
verify provider identity; handle revoked/cancelled/expired authorization
gracefully. Never request unnecessary scopes.

## 15–23. Provider specifics

Google Drive (live, change-tracking, export native Google types, restricted-scope
verification), OneDrive (Graph delta, stable IDs), Dropbox (cursor/webhooks),
TikTok (Data Portability API, full-export dedup), Apple/iCloud Photos (native iOS
+ backend upload API only — no browser full access), Google Photos (Picker +
Takeout, not a full background API), Facebook/Instagram (official transfer +
guided archive import), Snapchat (guided Memories import), X (archive importer +
optional verified API). Verify each against current official docs; document what
works / requires approval / is unavailable / fallback.

## 24–26. Local files & archive import

First-class local upload (drag/drop, folder, chunked/resumable, checksum, retry,
progress; never hold multi-GB in memory). Generic `ArchiveImporter` framework
(detect/inspect/parse/emitItems/emitRelationships/reportWarnings) with importers
for Google Takeout, Instagram, Facebook, Snapchat, X, generic ZIP. ZIP safety:
path traversal, zip-bomb/size limits, type validation, streaming, malware scan,
no execution, filename sanitisation. Automatic provider detection on upload (don't
ask "which provider?" unless detection fails).

## 27–29. Background jobs

Large imports run as persistent, chunked, retryable jobs — never inside one HTTP
request or a single Edge Function execution. Users may close the browser; work
continues. Job types: CONNECTOR_DISCOVERY, INITIAL_ARCHIVE, INCREMENTAL_ARCHIVE,
PORTABILITY_REQUEST, PORTABILITY_DOWNLOAD, ARCHIVE_PARSE, MEDIA_DOWNLOAD,
FILE_STORE, METADATA_PROCESS, INTEGRITY_CHECK, EXPORT, RECONCILIATION. Idempotent;
safe provider cursors; batch failure never restarts from zero.

## 30–34. Supabase, DB, webhooks, scheduler, reconciliation

Supabase for auth/PG/RLS/job+connector+audit metadata; storage via the abstraction
(not petabyte-coupled). Tables as needed (connector_definitions, connector_accounts,
connector_credentials_reference, connector_sync_state, archive_jobs,
archive_job_items, portability_requests, import_sessions, import_files,
provider_webhook_events, source_health_events, connector_action_required) — reuse
existing where equivalent; migrations only. Secure webhook endpoints (signature,
replay protection, idempotency, fast ack, background processing). Scheduler computes
next_archive_at per account; dispatcher selects due connectors (frequency, provider
restrictions, auth/rate state). Always reconcile periodically even with webhooks.

## 35–44. Resilience & consumer controls

Provider-specific rate-limit handling (honour Retry-After; never mark broken).
Authorization-expiry pre-warning + one-click renewal returning to context. Provider
outage ≠ deletion. Cross-platform duplicates: one binary, multiple source
relationships; keep higher-quality originals. Identity by SHA-256, not filename
(store provider item id too). Friendly progress UI; meaningful notifications only.
Frequency settings. Disconnect keeps archive ("Wat al in je archief staat, blijft
bewaard"). Deleting archived data is a separate explicit strongly-confirmed action,
never next to Disconnect.

## 45–51. Ops, testing, mocks, setup, dev page, flags, approval state

Internal source-health dashboard (no private content). Every connector: unit /
contract / OAuth-flow / parser / retry / rate-limit / auth-expiry / source-deletion
/ duplicate / large-archive / malformed-archive / provider-outage tests, synthetic
fixtures only. Provider mocks simulate the full range (auth, cancel, 10k/100k files,
pagination, cursor invalidation, token expiry, errors, rate limits, renames,
deletion, partial download, corrupt media, duplicate webhook/export). `docs/PROVIDER_SETUP.md`
= exact owner steps per provider. Non-prod `/dev/connectors` page (never public in
prod). Per-connector feature flags — prod UI only offers operational functionality
(archive-import fallback may stay enabled). Track provider approval separately from
implementation (CODE_COMPLETE / WAITING_FOR_PROVIDER / APPROVED / REJECTED /
NEEDS_CHANGES).

## 52. Connection priority

A Foundation: registry, contract, credential security, OAuth callback framework,
job scheduler, importer framework, source UI, source health, mock provider.
B Automatic: Google Drive, OneDrive, Dropbox. C Portability: TikTok. D Device:
Apple Photos backend + iOS spec + upload API. E Import-first: Google Photos Picker,
Google Takeout, Instagram, Facebook, Snapchat, X. F Partnerships: Meta receiving,
Google transfer options, Snapchat/X improvements.

## 53–60. UX target, principle, acceptance tests, docs, starting instruction

The source page should feel uniformly simple without lying about automation.
Consumer thinks: "Ik heb het één keer gekoppeld en hoef er daarna eigenlijk niet
meer over na te denken." Acceptance tests: automatic (20-step), portability
(14-step), import (12-step). Docs output: `docs/connectors/README.md` +
per-provider files + `docs/PROVIDER_SETUP.md` + `docs/CONNECTOR_SECURITY_REVIEW.md`,
each clearly separating WHAT WORKS / REQUIRES PROVIDER APPROVAL / NOT AVAILABLE /
FALLBACK. Starting instruction: inspect project, read specs, audit connector code,
verify current official docs, produce a capability matrix (VERIFIED / REQUIRES_APPROVAL
/ UNAVAILABLE / UNKNOWN), build generic architecture → mock → token infra → source
UX → then providers in priority order. Before implementing each provider, create/
update its doc. Never implement an assumption.

## Final principle

The technical architecture can be complicated; the consumer experience cannot.
Where full automation is impossible, the fallback must be so simple that a
non-technical consumer completes it without help.
