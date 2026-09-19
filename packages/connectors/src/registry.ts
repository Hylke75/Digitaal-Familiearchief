import type { ConnectorCapability } from './types';

/**
 * Connector capability registry — the honest source of truth for what each
 * source can do TODAY (CONNECTORS_BUILD.md §2, §10). Nothing is marked
 * `verified`/`production` until confirmed against official provider docs and
 * recorded in docs/connectors/<provider>.md. Classifications below are based on
 * well-established provider behaviour; each still requires a dated documentation
 * check before its status is advanced past `research`.
 *
 * The onboarding/sources UI is generated from this registry, so an unavailable
 * connector can never present a fake "Koppelen" button.
 */

// Conservative defaults; each entry overrides what it truthfully supports.
const BASE: Omit<ConnectorCapability, 'connectorKey' | 'displayName' | 'category' | 'featureFlag'> =
  {
    type: 'archive_importer',
    connectionType: 'unavailable',
    historicalImport: false,
    incrementalSync: false,
    automaticSync: false,
    webhooks: false,
    manualRefresh: false,
    oauth: false,
    authorizationExpiry: false,
    refreshSupported: false,
    deletionsDetectable: false,
    originalMediaAvailable: false,
    metadataAvailable: false,
    foldersOrAlbums: false,
    providerAccountIdentity: false,
    archiveImportSupported: false,
    supportsDaily: false,
    supportsWeekly: false,
    supportsMonthly: false,
    minimumSyncIntervalHours: 24,
    requiresProviderApproval: false,
    securityReviewRequired: false,
    implementationStatus: 'research',
    providerApprovalState: 'not_required',
  };

function def(
  entry: Partial<ConnectorCapability> &
    Pick<ConnectorCapability, 'connectorKey' | 'displayName' | 'category' | 'featureFlag'>,
): ConnectorCapability {
  return { ...BASE, ...entry };
}

export const CONNECTOR_REGISTRY: readonly ConnectorCapability[] = [
  // Internal test source — no external provider, safe to run in production.
  def({
    connectorKey: 'mock',
    displayName: 'Testbron',
    category: 'device',
    featureFlag: 'MOCK_ENABLED',
    type: 'live',
    connectionType: 'live_api',
    description: 'Interne testbron om de archiveringsflow te ervaren.',
    historicalImport: true,
    incrementalSync: true,
    automaticSync: true,
    manualRefresh: true,
    authorizationExpiry: true,
    deletionsDetectable: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    providerAccountIdentity: true,
    supportsDaily: true,
    supportsWeekly: true,
    supportsMonthly: true,
    minimumSyncIntervalHours: 0,
    implementationStatus: 'production',
    verification: { source: 'internal (no external provider)', verifiedAt: '2026-09-19' },
  }),

  // --- Document clouds (best automatic connectors, Phase B) ------------------
  def({
    connectorKey: 'google_drive',
    displayName: 'Google Drive',
    category: 'documents',
    featureFlag: 'GOOGLE_DRIVE_ENABLED',
    type: 'live',
    connectionType: 'live_api',
    description: 'Documenten en bestanden uit Google Drive.',
    historicalImport: true,
    incrementalSync: true,
    automaticSync: true,
    webhooks: true,
    manualRefresh: true,
    oauth: true,
    authorizationExpiry: true,
    refreshSupported: true,
    deletionsDetectable: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    foldersOrAlbums: true,
    providerAccountIdentity: true,
    supportsDaily: true,
    supportsWeekly: true,
    supportsMonthly: true,
    requiresProviderApproval: true, // restricted scope verification + CASA
    securityReviewRequired: true,
    providerApprovalState: 'waiting_for_provider',
  }),
  def({
    connectorKey: 'onedrive',
    displayName: 'OneDrive',
    category: 'documents',
    featureFlag: 'ONEDRIVE_ENABLED',
    type: 'live',
    connectionType: 'live_api',
    description: 'Bestanden uit Microsoft OneDrive.',
    historicalImport: true,
    incrementalSync: true,
    automaticSync: true,
    webhooks: true,
    manualRefresh: true,
    oauth: true,
    authorizationExpiry: true,
    refreshSupported: true,
    deletionsDetectable: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    foldersOrAlbums: true,
    providerAccountIdentity: true,
    supportsDaily: true,
    supportsWeekly: true,
    supportsMonthly: true,
  }),
  def({
    connectorKey: 'dropbox',
    displayName: 'Dropbox',
    category: 'documents',
    featureFlag: 'DROPBOX_ENABLED',
    type: 'live',
    connectionType: 'live_api',
    description: 'Bestanden uit Dropbox.',
    historicalImport: true,
    incrementalSync: true,
    automaticSync: true,
    webhooks: true,
    manualRefresh: true,
    oauth: true,
    authorizationExpiry: true,
    refreshSupported: true,
    deletionsDetectable: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    foldersOrAlbums: true,
    providerAccountIdentity: true,
    supportsDaily: true,
    supportsWeekly: true,
    supportsMonthly: true,
  }),

  // --- Photo / device --------------------------------------------------------
  def({
    connectorKey: 'apple_photos',
    displayName: "Apple Foto's",
    category: 'photo_video',
    featureFlag: 'APPLE_PHOTOS_ENABLED',
    type: 'live',
    connectionType: 'device_native', // requires a native iOS app (PhotoKit)
    description: "Foto's en video's van je iPhone via onze app.",
    historicalImport: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    foldersOrAlbums: true,
    supportsDaily: true,
    supportsWeekly: true,
    supportsMonthly: true,
  }),
  def({
    connectorKey: 'google_photos',
    displayName: "Google Foto's",
    category: 'photo_video',
    featureFlag: 'GOOGLE_PHOTOS_ENABLED',
    type: 'portability',
    connectionType: 'user_picker', // Picker API; full-library API is restricted
    description: "Kies foto's om veilig te stellen, of importeer je Google-archief.",
    originalMediaAvailable: true,
    metadataAvailable: true,
    oauth: true,
    archiveImportSupported: true, // via Google Takeout
    requiresProviderApproval: true,
    providerApprovalState: 'waiting_for_provider',
  }),
  def({
    connectorKey: 'phone',
    displayName: 'Telefoon',
    category: 'photo_video',
    featureFlag: 'LOCAL_UPLOAD_ENABLED',
    type: 'archive_importer',
    connectionType: 'archive_import',
    description: "Upload foto's, video's en bestanden vanaf je apparaat.",
    historicalImport: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    archiveImportSupported: true,
    implementationStatus: 'research',
  }),

  // --- Social ----------------------------------------------------------------
  def({
    connectorKey: 'instagram',
    displayName: 'Instagram',
    category: 'social',
    featureFlag: 'INSTAGRAM_ENABLED',
    type: 'archive_importer',
    connectionType: 'archive_import',
    description: 'Neem je Instagram-herinneringen mee via een export.',
    historicalImport: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    archiveImportSupported: true,
  }),
  def({
    connectorKey: 'facebook',
    displayName: 'Facebook',
    category: 'social',
    featureFlag: 'FACEBOOK_ENABLED',
    type: 'archive_importer',
    connectionType: 'archive_import',
    description: 'Neem je Facebook-herinneringen mee via een export.',
    historicalImport: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    archiveImportSupported: true,
  }),
  def({
    connectorKey: 'tiktok',
    displayName: 'TikTok',
    category: 'social',
    featureFlag: 'TIKTOK_ENABLED',
    type: 'portability',
    connectionType: 'portability_api',
    description: 'Stel je TikTok-inhoud veilig via officiële data-portabiliteit.',
    historicalImport: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    oauth: true,
    archiveImportSupported: true,
    requiresProviderApproval: true,
    securityReviewRequired: true,
    providerApprovalState: 'waiting_for_provider',
    minimumSyncIntervalHours: 24,
  }),
  def({
    connectorKey: 'snapchat',
    displayName: 'Snapchat',
    category: 'social',
    featureFlag: 'SNAPCHAT_ENABLED',
    type: 'archive_importer',
    connectionType: 'guided_export',
    description: 'Bewaar je Snapchat Memories via een export.',
    historicalImport: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    archiveImportSupported: true,
  }),
  def({
    connectorKey: 'x',
    displayName: 'X',
    category: 'social',
    featureFlag: 'X_ENABLED',
    type: 'archive_importer',
    connectionType: 'archive_import',
    description: 'Importeer je X-archief (posts, media en metadata).',
    historicalImport: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    archiveImportSupported: true,
  }),
];

const byKey = new Map(CONNECTOR_REGISTRY.map((c) => [c.connectorKey, c]));

export function getConnector(key: string): ConnectorCapability | undefined {
  return byKey.get(key);
}

export function connectorsByCategory(
  category: ConnectorCapability['category'],
): ConnectorCapability[] {
  return CONNECTOR_REGISTRY.filter((c) => c.category === category && c.connectorKey !== 'mock');
}

/** Whether a connector is enabled in the current environment (feature flag). */
export function isConnectorEnabled(
  c: ConnectorCapability,
  env: Record<string, string | undefined> = {},
): boolean {
  // The internal test source is always available.
  if (c.connectorKey === 'mock') return true;
  // Archive-import fallbacks may stay enabled without a flag (§50).
  if (c.connectionType === 'archive_import' || c.connectionType === 'guided_export') return true;
  return env[c.featureFlag] === 'true' || env[c.featureFlag] === '1';
}

/** Connectors that may present a live "Koppelen" action (production + enabled). */
export function liveConnectors(
  env: Record<string, string | undefined> = {},
): ConnectorCapability[] {
  return CONNECTOR_REGISTRY.filter(
    (c) => c.implementationStatus === 'production' && isConnectorEnabled(c, env),
  );
}

/** Consumer-facing action for a source, derived purely from capability + status. */
export type OnboardingAction = 'connect' | 'import' | 'select' | 'reconnect' | 'coming_soon';

export function onboardingAction(c: ConnectorCapability): OnboardingAction {
  if (c.implementationStatus === 'production') {
    switch (c.connectionType) {
      case 'live_api':
      case 'portability_api':
        return 'connect';
      case 'user_picker':
        return 'select';
      case 'archive_import':
      case 'guided_export':
        return 'import';
      default:
        return 'coming_soon';
    }
  }
  // Archive-import fallbacks can be offered in beta even before a live API exists.
  if (
    c.implementationStatus === 'beta' &&
    (c.connectionType === 'archive_import' || c.connectionType === 'guided_export')
  ) {
    return 'import';
  }
  return 'coming_soon';
}
