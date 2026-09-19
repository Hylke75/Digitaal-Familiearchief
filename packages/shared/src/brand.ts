/**
 * Central brand configuration for Bewora. Do not hardcode brand strings across
 * the app — reference these values (and, for URLs, the app-level env config).
 * Consumer-facing UI copy still flows through @dla/i18n; this is the canonical
 * source for the name, taglines and contact/legal pointers.
 */
export const BRAND = {
  name: 'Bewora',
  taglineNl: 'Alles wat je niet kwijt wilt. Op één veilige plek.',
  taglineEn: 'Keep what matters.',
  /** Configure via NEXT_PUBLIC_* env; these are safe placeholders. */
  supportEmail: 'support@bewora.nl',
  privacyPath: '/privacy',
  termsPath: '/terms',
  securityPath: '/security',
} as const;

export type Brand = typeof BRAND;
