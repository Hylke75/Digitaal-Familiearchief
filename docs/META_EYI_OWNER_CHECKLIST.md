# Meta EYI — Owner action checklist (Facebook + Instagram direct transfer)

These are the **external actions you (owner) must perform** to turn on direct
Facebook/Instagram transfer into Bewora. Bewora's code is built and mock-tested;
this is the approval track. Verified 2026-09-21 against Meta + DTI docs
(see `docs/connectors/meta-eyi.md` for sources). Until this is done, keep the
ZIP-import fallback; production shows no broken "Koppelen".

Status model (code ≠ approval):
`implementation_status: CODE_COMPLETE` · `provider_status: DTI_PENDING` · `meta_status: NOT_SUBMITTED` · `production_enabled: false`.

---

## BEFORE DTI APPLICATION — prerequisites (mostly ready)

- [ ] **Legal entity** exists with a registration id — you need an **LEI or DUNS** number for the registry. *(Owner: obtain LEI at gleif.org or DUNS at dnb.com if you don't have one.)*
- [x] **Website live** — https://bewora.nl *(prepared)*
- [x] **Service description** — homepage explains what Bewora does *(prepared)*
- [x] **Privacy policy live** — https://bewora.nl/privacy *(prepared; add the Meta-transfer paragraph — see checklist end)*
- [x] **Terms live** — https://bewora.nl/terms *(prepared)*
- [ ] **Security-issue reporting route live** — https://bewora.nl/security/report *(Claude prepared the page + `support@bewora.nl`; confirm the address is monitored)*
- [ ] **Data-use description** — a public page describing how Bewora processes/shares transferred data *(covered by privacy + `/security`; verify wording)*

## DTI TRUST LEVEL 1 (required — the 5 registry items)

Registry: **https://dt-reg.org** → application guide https://www.dt-reg.org/application-guide/

- [ ] Create a **service entry** for Bewora at dt-reg.org.
- [ ] Provide **company identification** (LEI or DUNS).
- [ ] Provide the **homepage** link: `https://bewora.nl`.
- [ ] Provide the **privacy policy** link: `https://bewora.nl/privacy`.
- [ ] Provide the **security-reporting** link: `https://bewora.nl/security/report`.
- [ ] Provide the **data-use description** link.
- [ ] Submit **Trust Level 1** application.
- [ ] Await **Level 1 approval**; make the registry entry public if required.

> **Level 2 (external SOC 2 audit) is NOT needed** for Bewora's photos/videos/posts/stories scope. Only required if you later ingest full "archive/blob" exports.

## META DEVELOPER / DATA TRANSFER APPLICATION

Portal: **https://developers.facebook.com/docs/data-portability/onboarding-guide/**

- [ ] Create + verify a **Facebook Business Manager**.
- [ ] Create a **developer account**; accept the Platform Terms.
- [ ] Create a **Data Transfer App** → use case *"Allow users to transfer their data to other apps."* → note the assigned **App ID**.
- [ ] Submit your **Data Trust Registry URL** in the portal.
- [ ] Complete the **Pre-Approval Form**: declare data types (photos, videos, posts, stories — NOT private messages), security standards, and the public privacy policy URL.
- [ ] **Configure OAuth 2.0** in Meta's form with Bewora's values *(Claude prepared these endpoints)*:
  - OAuth (authorize) URL: `https://bewora.nl/api/meta/oauth/authorize`
  - Access Token URL: `https://bewora.nl/api/meta/oauth/token`
  - Token Revocation URL: `https://bewora.nl/api/meta/oauth/revoke`
  - Client ID / Client Secret: generate a pair; set `META_EYI_CLIENT_ID` / `META_EYI_CLIENT_SECRET` in Vercel.
  - Importer base URL: `https://bewora.nl/api/meta/import`
  - Add **Meta's redirect URLs** (from the portal) to Bewora's allowlist env.
- [ ] Record the **assigned `import_service` Service ID** Meta gives Bewora → set `META_EYI_IMPORT_SERVICE` in Vercel.

## META SELF-SERVE TESTS

- [ ] Run an **end-to-end test transfer** from Meta Accounts Center (Export Your Information) into Bewora's endpoints (dev/staging).
- [ ] Confirm: authorize → token exchange → item POSTs arrive → archive shows the items.

## PRODUCTION APPROVAL

- [ ] **Request release** by emailing **dataportability@meta.com** (App ID, display name, contact).
- [ ] Await Meta listing Bewora as a selectable destination in EYI.

## FINAL PRODUCTION CONFIGURATION (in Vercel)

- [ ] `META_EYI_CLIENT_ID`, `META_EYI_CLIENT_SECRET`
- [ ] `META_EYI_IMPORT_SERVICE` (assigned Service ID)
- [ ] `META_EYI_OAUTH_SIGNING_SECRET` (`openssl rand -base64 32`)
- [ ] Meta redirect-URL allowlist value
- [ ] Flip flags: `META_EYI_ENABLED=true`, `META_EYI_FACEBOOK_ENABLED=true`, `META_EYI_INSTAGRAM_ENABLED=true`, `META_EYI_DIRECT_TRANSFER_APPROVED=true`, `META_EYI_MOCK=false`
- [ ] Redeploy.

## Privacy-policy paragraph to add (Meta/DTI readiness)

Add to `/privacy`: what Bewora receives from Facebook/Instagram (photos, videos,
posts, stories + related metadata), that the user explicitly initiates the
transfer at Meta, purpose (personal archive only — no sale, no ads, no model
training), retention, export, deletion, disconnect behaviour, EU storage,
processors, and contact. Draft copy: `docs/provider-review/meta/use-case.md`.

---

**What Claude has prepared (verified + tested):** the verified protocol doc, the
core logic — destination-OAuth token primitives, deep-link builder, Meta→Bewora
adapter, ingestion + dedup/idempotency, mock sender — with unit tests, plus
feature flags, the data-category config, this checklist, the security review and
use-case docs, and `/security` + `/security/report`.

**Immediate next build (code, no external dependency):** the HTTP wiring — the
destination-OAuth routes (`/api/meta/oauth/authorize|token|revoke`), the importer
routes (`/api/meta/import/*`), the DB migration (oauth clients/codes/tokens +
transfer tracking), the gated Facebook/Instagram source UI, and the `/dev/connectors/meta`
mock harness. The pure logic they wire is already done and tested.

Only the external **DTI/Meta approvals + credentials** above are true blockers.
