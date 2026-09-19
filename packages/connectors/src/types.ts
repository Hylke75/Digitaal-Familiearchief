/**
 * @dla/connectors — connector interface and capability model (CLAUDE.md §15–§17).
 *
 * Golden rule: capabilities are declared honestly. A connector may only be
 * marked `verified`/`production` after confirmation against official provider
 * documentation or tested behaviour (see docs/connectors.md). The onboarding UI
 * is generated from this registry, so an unverified connector can never present
 * a fake "Connect" button (CLAUDE.md §3 Phase 3 acceptance).
 */

export type ConnectorCategory = 'photo_video' | 'social' | 'documents' | 'device';

/** How the connector obtains data (CLAUDE.md §16). Legacy coarse type. */
export type ConnectorType = 'live' | 'portability' | 'archive_importer';

/** Precise mechanism a connector uses (CONNECTORS_BUILD.md §10). */
export type ConnectionType =
  | 'live_api' // OAuth API with historical + incremental access
  | 'portability_api' // official data-portability export requests
  | 'device_native' // requires a native device app (e.g. Apple PhotoKit)
  | 'user_picker' // provider picker; user selects items (not full library)
  | 'guided_export' // user requests an official export, then uploads it
  | 'archive_import' // user uploads a provider export archive
  | 'unavailable';

/**
 * Lifecycle of a connector implementation. Only `production` may be offered as a
 * live "Koppelen" action in onboarding.
 */
export type ImplementationStatus =
  | 'research'
  | 'verified'
  | 'development'
  | 'provider_approval'
  | 'beta'
  | 'production'
  | 'disabled';

/** Provider approval is tracked separately from our implementation (§51). */
export type ProviderApprovalState =
  | 'not_required'
  | 'code_complete'
  | 'waiting_for_provider'
  | 'approved'
  | 'rejected'
  | 'needs_changes';

export type ArchiveFrequency = 'daily' | 'weekly' | 'monthly';

/** Internal connection status (§9). Mapped to consumer language in the app. */
export type ConnectorAccountStatus =
  | 'not_connected'
  | 'connecting'
  | 'authorizing'
  | 'connected'
  | 'discovering'
  | 'initial_archive'
  | 'archiving'
  | 'healthy'
  | 'temporary_error'
  | 'action_required'
  | 'authorization_expired'
  | 'manual_import_available'
  | 'provider_approval_required'
  | 'unavailable'
  | 'disconnected';

/** Declared, verifiable capabilities of a connector (CONNECTORS_BUILD.md §10). */
export interface ConnectorCapability {
  connectorKey: string;
  displayName: string;
  category: ConnectorCategory;
  type: ConnectorType;
  connectionType: ConnectionType;
  /** Short consumer-facing description. */
  description?: string;

  // What the connector can do
  historicalImport: boolean;
  incrementalSync: boolean;
  automaticSync: boolean;
  webhooks: boolean;
  manualRefresh: boolean;
  oauth: boolean;
  authorizationExpiry: boolean;
  refreshSupported: boolean;
  deletionsDetectable: boolean;
  originalMediaAvailable: boolean;
  metadataAvailable: boolean;
  foldersOrAlbums: boolean;
  providerAccountIdentity: boolean;
  archiveImportSupported: boolean;

  // Scheduling (§7)
  supportsDaily: boolean;
  supportsWeekly: boolean;
  supportsMonthly: boolean;
  /** Minimum hours between syncs the provider allows (e.g. 24 for daily exports). */
  minimumSyncIntervalHours: number;

  // Governance
  requiresProviderApproval: boolean;
  securityReviewRequired: boolean;
  implementationStatus: ImplementationStatus;
  providerApprovalState: ProviderApprovalState;
  /** Env flag that gates this connector in production (§50). */
  featureFlag: string;

  /** Provenance for the claims above — required before `verified` (CLAUDE.md §15). */
  verification?: {
    source: string;
    verifiedAt: string;
  };
}

// --- Discovery / import value objects --------------------------------------

export interface DiscoveredItem {
  sourceItemId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAtSource?: string;
  modifiedAtSource?: string;
}

export interface ConnectorStatus {
  status: ConnectorAccountStatus;
  /** Consumer-safe message already mapped to human language (CLAUDE.md §51). */
  safeMessage?: string;
  authorizationExpiresAt?: string;
}

export interface ChangeSet {
  added: DiscoveredItem[];
  modified: DiscoveredItem[];
  deletedSourceItemIds: string[];
  /** Opaque cursor to persist for the next incremental run (never logged). */
  nextCursor?: string;
}

/**
 * The provider-agnostic connector contract. Provider authentication is kept
 * separate from archive ingestion: connectors only *discover and fetch*; the
 * Archive Engine owns checksum/dedup/store/index (CLAUDE.md §17, §20).
 */
export interface ArchiveConnector {
  readonly capability: ConnectorCapability;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  validateConnection(): Promise<boolean>;
  discover(): Promise<DiscoveredItem[]>;
  initialImport(): AsyncIterable<DiscoveredItem>;
  getChanges(cursor?: string): Promise<ChangeSet>;
  importChanges(changes: ChangeSet): AsyncIterable<DiscoveredItem>;
  /**
   * Fetch the raw bytes for a discovered item. Kept separate from discovery so
   * the Archive Engine controls when originals are downloaded (§20, §31).
   */
  fetchContent(item: DiscoveredItem): Promise<Uint8Array>;
  refreshAuthorization(): Promise<void>;
  getStatus(): Promise<ConnectorStatus>;
}

/** Map an archive item type from a mime type (best-effort). */
export function archiveTypeFromMime(
  mimeType: string,
): 'photo' | 'video' | 'document' | 'audio' | 'other' {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet')
  ) {
    return 'document';
  }
  return 'other';
}
