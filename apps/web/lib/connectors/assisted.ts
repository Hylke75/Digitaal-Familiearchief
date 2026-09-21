/**
 * "Assisted transfer" connectors — sources that offer no third-party API to pull
 * a user's media (Instagram/Facebook: Basic Display API shut down 2024, Graph API
 * is business-only), but DO support Meta's official "Transfer Your Information"
 * tool, which copies a user's photos/videos straight into Dropbox. Bewora already
 * archives Dropbox automatically, so this gives an honest "connect once" feel
 * without scraping or a manual ZIP. Verified 2026 against the Data Transfer
 * Initiative registry, Meta Newsroom and Dropbox Help (worldwide; photos+videos).
 */
export interface AssistedGuide {
  /** Consumer action label on the source card. */
  label: string;
  /** Where the source card links to. */
  href: string;
  /** Short, honest description for the card. */
  description: string;
}

export const ASSISTED_GUIDES: Record<string, AssistedGuide> = {
  instagram: {
    label: 'Koppelen',
    href: '/koppelen/meta',
    description: "Voeg je Instagram-foto's toe via Dropbox — Bewora archiveert ze automatisch.",
  },
  facebook: {
    label: 'Koppelen',
    href: '/koppelen/meta',
    description: "Voeg je Facebook-foto's toe via Dropbox — Bewora archiveert ze automatisch.",
  },
};

export function getAssistedGuide(connectorKey: string): AssistedGuide | undefined {
  return ASSISTED_GUIDES[connectorKey];
}
