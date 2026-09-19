# Legal review required — Bewora

_Items that need professional Dutch/EU (GDPR/AVG) legal review before launch. The
public `/privacy` and `/terms` pages are written in plain, honest language for
MVP; do not treat them as legally vetted until the items below are confirmed._

## Company & contact

- [ ] Legal entity, KvK number, registered address to appear where required.
- [ ] Official contact + (if applicable) DPO / privacy contact and address.
- [ ] Confirm `support@` / privacy contact address on the real Bewora domain.

## Privacy policy (`/privacy`)

- [ ] Legal basis per processing purpose (consent / contract / legitimate interest).
- [ ] Exact retention periods per data category.
- [ ] Full processor list + locations + Data Processing Agreements (Supabase, Vercel,
      each connected provider).
- [ ] International transfer wording (should be EU-only; confirm no US transfer).
- [ ] Rights request handling process + response times (AVG).
- [ ] Cookie / tracking statement (Bewora is cookieless by design — confirm).
- [ ] Provider-specific data-handling disclosures (Google, Microsoft, Dropbox, TikTok,
      Meta) as required by each provider's platform terms.

## Terms (`/terms`)

- [ ] Liability limitations valid under Dutch/EU consumer law.
- [ ] Governing law & jurisdiction clause.
- [ ] Subscription / billing terms (when monetisation is added).
- [ ] Acceptable-use and termination clauses.
- [ ] Digital legacy / passing-on provisions (future; requires separate review).

## Provider compliance

- [ ] Google API Services User Data Policy / Limited Use compliance statement.
- [ ] TikTok Data Portability API terms + EEA/UK scoping wording.
- [ ] Meta platform terms for import/transfer.
- [ ] Confirm no provider ToS is breached by the archival model.

## Digital legacy (future)

- [ ] Legal review of any "pass my archive on" feature before it ships (identity
      verification, fraud prevention, inheritance law).

> Nothing marked here should block building; it blocks **production launch** and
> some **provider production reviews**.
