/**
 * Central brand configuration for Bewora — the single source of truth for the
 * name, taglines, core messaging, colour tokens, logo assets and company/legal
 * pointers (docs/BRAND.md §39–§40). Do not hardcode brand strings or colours
 * across the app. Long-form marketing copy lives in the marketing content
 * module; consumer-facing app UI copy flows through @dla/i18n.
 *
 * Commercial facts (company registration, storage region, certifications, …)
 * are intentionally `null` until verified. Rendering code MUST skip null fields
 * rather than inventing a value.
 */
export const BRAND = {
  name: 'Bewora',

  // Brand lines
  taglineNl: 'Bewaar wat van jou is.',
  taglineEn: 'Keep what’s yours.',
  heroHeadlineNl: ['Instagram bewaart Instagram.', 'Google bewaart Google.', 'Bewora bewaart jou.'],
  heroBodyNl:
    "Koppel je foto's, sociale media en documenten één keer. Bewora verzamelt ze automatisch in een onafhankelijk digitaal archief dat van jou blijft.",
  /** Four-word product model (docs/POSITIONING.md). */
  mechanismNl: ['Koppelen', 'Bewaren', 'Terugvinden', 'Doorgeven'],

  /** Colour tokens (mirror tailwind.config.ts; docs/BRAND.md §8–§9). */
  colors: {
    archiveGreen: '#1D3D2A',
    archiveGreenDark: '#142C1E',
    warmPaper: '#FAF6F1',
    surface: '#FFFFFF',
    brass: '#9B5B19',
    charcoal: '#1B211D',
    secondaryText: '#59635C',
    sage: '#A8B4A9',
    warning: '#8A4B12',
    interactiveBorder: '#7F8981',
  },

  /** Logo assets (docs/BRAND.md §11). SVG preferred. */
  logo: {
    primary: '/brand/bewora-logo-primary.svg',
    reversed: '/brand/bewora-logo-reversed.svg',
    icon: '/brand/bewora-logo-icon.svg',
    iconReversed: '/brand/bewora-logo-icon-reversed.svg',
    stacked: '/brand/bewora-logo-stacked.svg',
    favicon: '/brand/bewora-favicon.svg',
  },

  /** Contact + legal pointers. */
  supportEmail: 'support@bewora.nl',
  contactPath: '/contact',
  privacyPath: '/privacy',
  termsPath: '/terms',
  securityPath: '/security',

  /**
   * Company / commercial metadata. `null` = not yet verified → do not render.
   * Fill these in only with confirmed facts (owner decision required).
   */
  company: {
    legalName: null as string | null,
    registration: null as string | null, // e.g. KvK number
    country: 'Nederland' as string | null,
    storageRegion: 'EU (eu-central-1)' as string | null,
  },
} as const;

export type Brand = typeof BRAND;
