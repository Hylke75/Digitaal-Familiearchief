import { describe, expect, it } from 'vitest';
import {
  CONNECTOR_REGISTRY,
  connectorsByCategory,
  getConnector,
  isConnectorEnabled,
  liveConnectors,
  onboardingAction,
} from './registry';

describe('connector registry — honesty guarantees', () => {
  it('never marks a real external provider as production without verification', () => {
    for (const c of CONNECTOR_REGISTRY) {
      if (c.connectorKey === 'mock') continue;
      expect(c.implementationStatus).not.toBe('production');
    }
  });

  it('requires verification provenance for any verified/production connector', () => {
    for (const c of CONNECTOR_REGISTRY) {
      if (c.implementationStatus === 'verified' || c.implementationStatus === 'production') {
        expect(c.verification, `${c.connectorKey} must record verification`).toBeDefined();
      }
    }
  });

  it('only the mock connector is offered as live in this phase', () => {
    expect(liveConnectors().map((c) => c.connectorKey)).toEqual(['mock']);
  });

  it('unavailable connectors surface as "coming_soon", never a fake connect', () => {
    expect(onboardingAction(getConnector('google_drive')!)).toBe('coming_soon');
    expect(onboardingAction(getConnector('tiktok')!)).toBe('coming_soon');
  });

  it('feature flags gate non-fallback connectors; archive-import stays available', () => {
    const drive = getConnector('google_drive')!;
    expect(isConnectorEnabled(drive, {})).toBe(false);
    expect(isConnectorEnabled(drive, { GOOGLE_DRIVE_ENABLED: 'true' })).toBe(true);
    // Instagram is archive-import → available as a fallback without a flag.
    expect(isConnectorEnabled(getConnector('instagram')!, {})).toBe(true);
  });

  it('every connector declares a connection type and feature flag', () => {
    for (const c of CONNECTOR_REGISTRY) {
      expect(c.connectionType).toBeTruthy();
      expect(c.featureFlag).toBeTruthy();
    }
  });

  it('groups sources by category (excluding the internal mock)', () => {
    expect(connectorsByCategory('documents').map((c) => c.connectorKey)).toEqual([
      'google_drive',
      'onedrive',
      'dropbox',
    ]);
    expect(connectorsByCategory('social').length).toBeGreaterThanOrEqual(5);
  });

  it('has unique connector keys', () => {
    const keys = CONNECTOR_REGISTRY.map((c) => c.connectorKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
