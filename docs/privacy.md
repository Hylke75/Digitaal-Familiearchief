# Privacy (GDPR / AVG)

_Status: Phase 0 — principles and design commitments._

Privacy by design from day one (CLAUDE.md §48).

## Commitments

- **EU processing**: the Supabase project runs in **eu-central-1 (Frankfurt)**.
- **Data minimisation & purpose limitation**: we store what is needed to preserve
  and organise a user's archive, and metadata needed to operate it — nothing more.
- **Consent & revocation**: connecting a source is an explicit act; disconnecting
  is always available and **does not delete archived content** (§29). The user is
  told this clearly.
- **Export (portability)**: users can download their full archive with originals
  plus portable metadata, no proprietary format (§40).
- **Deletion**: account deletion is explicit and protected; disconnecting ≠
  deleting; deleting ≠ instant silent destruction. MVP provides at minimum a
  documented deletion-request process (§41).
- **Retention**: retention policies are defined per data category as features
  land; source-deletion is recorded but does not purge the archive (§4).
- **No overclaiming**: we do not market "100% private", "unhackable", "fully
  encrypted" or "zero knowledge" unless technically proven (§48).

## Personal data categories (to be maintained)

- Account/identity (email, auth identifiers).
- Connector metadata (which sources, status, timestamps) — no plaintext tokens.
- Archived content (photos/videos/documents/etc.) — the user's own data, access
  restricted to the user by RLS; admins have no automatic access (§46).
- Operational logs — redacted of secrets and private content (§49).

## Processors

Supabase (database, auth, storage, EU region) and Vercel (hosting) are the initial
processors. A processor register + DPAs are maintained as the product moves toward
production.

## Data retention

- **Archived content** is retained for the life of the account — that is the
  product's purpose (§4: source deletion never deletes the archived copy). The
  user removes items explicitly; there is no silent expiry.
- **Derivatives** (thumbnails, posters, document previews) are cache-like: they
  can be regenerated from the original and may be pruned without data loss.
- **Security audit events** (§47) record operational metadata only (event type,
  timestamp, user id, non-sensitive context) — never archived content or tokens.
  Retained for security/forensics; a bounded retention window is set before
  production.
- **Operational logs** are redacted of secrets and private content (§49) and are
  short-lived per the hosting platform's defaults.
- **Account deletion** (§41) follows a documented request process; disconnecting
  a source is separate and never deletes archived content.
