/**
 * Beeld & Geluid / Schatkamer — provider-neutral external-archive model
 * (docs/connectors/beeld-en-geluid.md §6, §12). Bewora stores the MEMORY +
 * metadata + link; the audiovisual media stays at Beeld & Geluid (link-only by
 * default). Nothing here copies or proxies protected media.
 */

/** Rights states for an external item (§12). Default for protected material is
 * `link_only`. Never infer public domain from age — use the provider's own
 * rights indication only (§14). */
export type RightsStatus =
  | 'public_domain'
  | 'open_license'
  | 'link_only'
  | 'embed_allowed'
  | 'embed_not_allowed'
  | 'rights_unknown'
  | 'requires_permission';

export interface ExternalArchiveItem {
  provider: 'beeld_en_geluid';
  /** Stable catalogue identifier (persistent). */
  providerRecordId: string;
  title: string;
  subtitle?: string;
  description?: string;
  broadcastDate?: string;
  productionDate?: string;
  broadcaster?: string;
  series?: string;
  episode?: string;
  durationSeconds?: number;
  mediaType?: 'video' | 'audio' | 'other';
  /** The official public Schatkamer/catalogue page for the item. */
  publicPageUrl?: string;
  streamId?: string;
  rightsStatus: RightsStatus;
  license?: string;
  publicDomain: boolean;
  embeddable: boolean;
  thumbnailUrl?: string;
  thumbnailRightsStatus?: RightsStatus;
  /** When the metadata was last fetched/checked. */
  metadataCheckedAt?: string;
}

/** A user's personal memory linked to an external item (§7). Personal fields are
 * private to the user; the external item may be shared/cached across users (§37). */
export interface MemoryExternalLink {
  memoryId: string;
  externalArchiveItemId: string;
  fragmentStartSeconds?: number;
  fragmentEndSeconds?: number;
  deepLinkUrl?: string;
}

/** Can Bewora render the official embed for this item? Only when rights permit
 * AND the provider marks it embeddable (§14, §15). Never iframe protected pages. */
export function canEmbed(
  item: Pick<ExternalArchiveItem, 'embeddable' | 'rightsStatus' | 'publicDomain'>,
): boolean {
  if (!item.embeddable) return false;
  return (
    item.publicDomain ||
    item.rightsStatus === 'public_domain' ||
    item.rightsStatus === 'embed_allowed'
  );
}
