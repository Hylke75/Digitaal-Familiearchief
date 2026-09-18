import { describe, expect, it } from 'vitest';
import { CONNECTOR_REGISTRY, getConnector, liveConnectors, onboardingAction } from './registry';

describe('connector registry — honesty guarantees', () => {
  it('never marks a real external provider as production without verification', () => {
    for (const c of CONNECTOR_REGISTRY) {
      if (c.connectorKey === 'mock') continue;
      // No external connector is verified yet in Phase 0.
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

  it('only the mock connector is offered as live in Phase 0', () => {
    expect(liveConnectors().map((c) => c.connectorKey)).toEqual(['mock']);
  });

  it('unavailable connectors surface as "coming_soon", never a fake connect', () => {
    const drive = getConnector('google_drive')!;
    expect(onboardingAction(drive)).toBe('coming_soon');
  });

  it('has unique connector keys', () => {
    const keys = CONNECTOR_REGISTRY.map((c) => c.connectorKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
