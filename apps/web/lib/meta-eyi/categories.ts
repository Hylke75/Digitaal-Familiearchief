/**
 * Meta EYI data-category configuration (docs BRAND_UPDATE-connector spec §20,
 * §21, §38). Data minimisation: Bewora requests only what serves the archive
 * promise — photos, videos, posts, stories. Private messages are a SENSITIVE
 * category and are DISABLED by default pending a separate product/privacy
 * decision. Category keys are the verified Meta `sections[]` enum ids
 * (docs/connectors/meta-eyi.md).
 */
export type MetaPlatform = 'facebook' | 'instagram';

export interface MetaCategory {
  /** Meta `sections[]` enum id. */
  key: string;
  /** Consumer-friendly Dutch label (never show raw enum names, §21). */
  displayName: string;
  sensitivity: 'normal' | 'sensitive';
  /** Requested by default (subject to the sensitive-category flag). */
  enabled: boolean;
}

/** Master switch for sensitive categories (private messages). Default off (§20). */
export const SENSITIVE_CATEGORIES_ENABLED = false;

export const META_CATEGORIES: Record<MetaPlatform, MetaCategory[]> = {
  facebook: [
    {
      key: 'POSTS_YOUR_ACTIVITY',
      displayName: "Berichten en foto's",
      sensitivity: 'normal',
      enabled: true,
    },
    { key: 'STORIES_YOUR_ACTIVITY', displayName: 'Verhalen', sensitivity: 'normal', enabled: true },
    {
      key: 'LIVE_VIDEOS_YOUR_ACTIVITY',
      displayName: "Video's",
      sensitivity: 'normal',
      enabled: true,
    },
    {
      key: 'MESSENGER_V2',
      displayName: 'Privéberichten',
      sensitivity: 'sensitive',
      enabled: false,
    },
  ],
  instagram: [
    {
      key: 'IG_YOUR_ACTIVITY',
      displayName: "Foto's en video's",
      sensitivity: 'normal',
      enabled: true,
    },
    { key: 'IG_STORY_ACTIVITIES', displayName: 'Verhalen', sensitivity: 'normal', enabled: true },
    { key: 'IG_MESSAGES', displayName: 'Privéberichten', sensitivity: 'sensitive', enabled: false },
  ],
};

/** The `sections[]` values Bewora requests for a platform, honouring minimisation. */
export function requestedSections(platform: MetaPlatform): string[] {
  return META_CATEGORIES[platform]
    .filter((c) => c.enabled && (c.sensitivity !== 'sensitive' || SENSITIVE_CATEGORIES_ENABLED))
    .map((c) => c.key);
}
