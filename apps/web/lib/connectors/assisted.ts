/**
 * Guided source cards — sources whose connect action routes to a guided flow
 * instead of a direct web OAuth. Two kinds today:
 *  - Instagram/Facebook: no third-party API to pull media (Basic Display shut
 *    down 2024, Graph is business-only), so a guided transfer (Meta → Dropbox,
 *    verified against the Data Transfer Initiative registry + Meta Newsroom +
 *    Dropbox Help). Direct Meta EYI transfer is the future path (docs/connectors/meta-eyi.md).
 *  - Apple Foto's: no browser API at all (docs/connectors/apple-photos.md) — the
 *    card opens the "use the iPhone app" landing (universal link).
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
  apple_photos: {
    label: 'Open op iPhone',
    href: '/connect/apple-photos',
    description: 'Automatisch via de Bewora-app op je iPhone.',
  },
};

export function getAssistedGuide(connectorKey: string): AssistedGuide | undefined {
  return ASSISTED_GUIDES[connectorKey];
}
