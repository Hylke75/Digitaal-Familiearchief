/**
 * Trust facts (docs BRAND_UPDATE §27, §53). ONLY verified facts belong here.
 * Anything unknown or unverified stays `null` and is NOT rendered — never
 * invent user numbers, testimonials, certifications, audits or company details.
 */
export interface TrustFact {
  label: string;
  value: string;
}

const facts: (TrustFact | null)[] = [
  // Verified, factual statements about the current architecture:
  { label: 'Opslagregio', value: 'Europese Unie (Supabase, eu-central-1)' },
  { label: 'Versleuteling in transport', value: 'Versleutelde verbinding (HTTPS/TLS)' },
  { label: 'Opslag', value: 'Originelen versleuteld opgeslagen (Supabase Storage)' },
  { label: 'Eigenaarschap', value: 'Originele bestanden zijn te downloaden' },
  { label: 'Contact', value: 'support@bewora.nl' },

  // Unverified → null (not rendered). Fill in only with confirmed facts:
  // company registration (KvK), independent security audit, certifications,
  // user numbers, testimonials, press.
  null,
];

export const TRUST_FACTS: TrustFact[] = facts.filter((f): f is TrustFact => f !== null);

/**
 * Social proof (testimonials/press/ratings) — none verified yet, so the section
 * is hidden. Never fill this with fictional people.
 */
export const HAS_SOCIAL_PROOF = false;
