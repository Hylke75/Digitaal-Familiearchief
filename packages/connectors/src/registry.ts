import type { ConnectorCapability } from './types';

/**
 * Connector capability registry — the honest source of truth for what each
 * source can actually do TODAY. Every entry below is deliberately conservative:
 * nothing is marked `verified`/`production` until confirmed against official
 * provider documentation and recorded in docs/connectors.md.
 *
 * Phase 0 seeds capabilities as `research` (real providers) and `production`
 * only for the internal MockArchiveConnector, which touches no external service.
 */
export const CONNECTOR_REGISTRY: readonly ConnectorCapability[] = [
  {
    connectorKey: 'mock',
    displayName: 'Testbron (mock)',
    category: 'device',
    type: 'live',
    historicalImport: true,
    incrementalSync: true,
    automaticSync: true,
    webhooks: false,
    oauth: false,
    authorizationExpiry: true,
    deletionsDetectable: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    archiveImportSupported: false,
    requiresProviderApproval: false,
    implementationStatus: 'production',
    verification: { source: 'internal (no external provider)', verifiedAt: '2026-09-18' },
  },
  {
    connectorKey: 'google_drive',
    displayName: 'Google Drive',
    category: 'documents',
    type: 'live',
    historicalImport: true,
    incrementalSync: true,
    automaticSync: true,
    webhooks: true,
    oauth: true,
    authorizationExpiry: true,
    deletionsDetectable: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    archiveImportSupported: false,
    requiresProviderApproval: true,
    implementationStatus: 'research',
  },
  {
    connectorKey: 'google_photos',
    displayName: "Google Foto's",
    category: 'photo_video',
    type: 'portability',
    historicalImport: true,
    incrementalSync: false,
    automaticSync: false,
    webhooks: false,
    oauth: true,
    authorizationExpiry: true,
    deletionsDetectable: false,
    originalMediaAvailable: true,
    metadataAvailable: true,
    archiveImportSupported: true,
    requiresProviderApproval: true,
    implementationStatus: 'research',
  },
  {
    connectorKey: 'apple_photos',
    displayName: "Apple Foto's",
    category: 'photo_video',
    type: 'live',
    historicalImport: true,
    incrementalSync: false,
    automaticSync: false,
    webhooks: false,
    oauth: false,
    authorizationExpiry: false,
    deletionsDetectable: false,
    originalMediaAvailable: true,
    metadataAvailable: true,
    archiveImportSupported: false,
    requiresProviderApproval: false,
    implementationStatus: 'research',
  },
  {
    connectorKey: 'onedrive',
    displayName: 'OneDrive',
    category: 'documents',
    type: 'live',
    historicalImport: true,
    incrementalSync: true,
    automaticSync: true,
    webhooks: true,
    oauth: true,
    authorizationExpiry: true,
    deletionsDetectable: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    archiveImportSupported: false,
    requiresProviderApproval: false,
    implementationStatus: 'research',
  },
  {
    connectorKey: 'dropbox',
    displayName: 'Dropbox',
    category: 'documents',
    type: 'live',
    historicalImport: true,
    incrementalSync: true,
    automaticSync: true,
    webhooks: true,
    oauth: true,
    authorizationExpiry: true,
    deletionsDetectable: true,
    originalMediaAvailable: true,
    metadataAvailable: true,
    archiveImportSupported: false,
    requiresProviderApproval: false,
    implementationStatus: 'research',
  },
  {
    connectorKey: 'instagram',
    displayName: 'Instagram',
    category: 'social',
    type: 'archive_importer',
    historicalImport: true,
    incrementalSync: false,
    automaticSync: false,
    webhooks: false,
    oauth: false,
    authorizationExpiry: false,
    deletionsDetectable: false,
    originalMediaAvailable: true,
    metadataAvailable: true,
    archiveImportSupported: true,
    requiresProviderApproval: false,
    implementationStatus: 'research',
  },
  {
    connectorKey: 'facebook',
    displayName: 'Facebook',
    category: 'social',
    type: 'archive_importer',
    historicalImport: true,
    incrementalSync: false,
    automaticSync: false,
    webhooks: false,
    oauth: false,
    authorizationExpiry: false,
    deletionsDetectable: false,
    originalMediaAvailable: true,
    metadataAvailable: true,
    archiveImportSupported: true,
    requiresProviderApproval: false,
    implementationStatus: 'research',
  },
  {
    connectorKey: 'tiktok',
    displayName: 'TikTok',
    category: 'social',
    type: 'portability',
    historicalImport: true,
    incrementalSync: false,
    automaticSync: false,
    webhooks: false,
    oauth: false,
    authorizationExpiry: false,
    deletionsDetectable: false,
    originalMediaAvailable: true,
    metadataAvailable: true,
    archiveImportSupported: true,
    requiresProviderApproval: false,
    implementationStatus: 'research',
  },
];

const byKey = new Map(CONNECTOR_REGISTRY.map((c) => [c.connectorKey, c]));

export function getConnector(key: string): ConnectorCapability | undefined {
  return byKey.get(key);
}

/** Connectors that may present a live "Koppelen" action in onboarding. */
export function liveConnectors(): ConnectorCapability[] {
  return CONNECTOR_REGISTRY.filter((c) => c.implementationStatus === 'production');
}

/** Consumer-facing action derived purely from declared capability + status. */
export type OnboardingAction = 'connect' | 'import' | 'coming_soon' | 'reconnect';

export function onboardingAction(c: ConnectorCapability): OnboardingAction {
  if (c.implementationStatus === 'production') {
    return c.archiveImportSupported && !c.oauth && c.type === 'archive_importer'
      ? 'import'
      : 'connect';
  }
  if (c.implementationStatus === 'beta' && c.type === 'archive_importer') return 'import';
  return 'coming_soon';
}
