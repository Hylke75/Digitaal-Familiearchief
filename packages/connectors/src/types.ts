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

/** How the connector obtains data (CLAUDE.md §16). */
export type ConnectorType = 'live' | 'portability' | 'archive_importer';

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

export type ArchiveFrequency = 'daily' | 'weekly' | 'monthly';

export type ConnectorAccountStatus =
  'connected' | 'archiving' | 'action_required' | 'temporary_problem' | 'disconnected';

/** Declared, verifiable capabilities of a connector. */
export interface ConnectorCapability {
  connectorKey: string;
  displayName: string;
  category: ConnectorCategory;
  type: ConnectorType;

  historicalImport: boolean;
  incrementalSync: boolean;
  automaticSync: boolean;
  webhooks: boolean;
  oauth: boolean;
  authorizationExpiry: boolean;
  deletionsDetectable: boolean;
  originalMediaAvailable: boolean;
  metadataAvailable: boolean;
  archiveImportSupported: boolean;

  requiresProviderApproval: boolean;
  implementationStatus: ImplementationStatus;

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
  refreshAuthorization(): Promise<void>;
  getStatus(): Promise<ConnectorStatus>;
}
