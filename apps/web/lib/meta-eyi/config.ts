import { buildMetaEyiDeepLink } from './deeplink';
import type { MetaPlatform } from './categories';

/**
 * Meta EYI runtime config (docs/connectors/meta-eyi.md). Feature flags gate what
 * the UI shows; a working "Koppelen" CTA is offered only when direct transfer is
 * approved. `mock` lets the whole flow run without Meta in dev.
 */
export const metaEyiConfig = {
  get enabled(): boolean {
    return process.env.META_EYI_ENABLED === 'true';
  },
  facebookEnabled(): boolean {
    return this.enabled && process.env.META_EYI_FACEBOOK_ENABLED === 'true';
  },
  instagramEnabled(): boolean {
    return this.enabled && process.env.META_EYI_INSTAGRAM_ENABLED === 'true';
  },
  get directTransferApproved(): boolean {
    return process.env.META_EYI_DIRECT_TRANSFER_APPROVED === 'true';
  },
  get mock(): boolean {
    return process.env.META_EYI_MOCK !== 'false';
  },
  /** The Meta-assigned destination Service ID (from onboarding). */
  get importService(): string | undefined {
    return process.env.META_EYI_IMPORT_SERVICE;
  },
  platformEnabled(platform: MetaPlatform): boolean {
    return platform === 'facebook' ? this.facebookEnabled() : this.instagramEnabled();
  },
} as const;

/** The consumer connect status for a Meta platform card. */
export type MetaConnectState = 'approved' | 'pending_approval' | 'disabled';

export function metaConnectState(platform: MetaPlatform): MetaConnectState {
  if (!metaEyiConfig.platformEnabled(platform)) return 'disabled';
  return metaEyiConfig.directTransferApproved && metaEyiConfig.importService
    ? 'approved'
    : 'pending_approval';
}

/** The deep-link that starts the transfer at Meta, or null if not ready. */
export function metaConnectDeepLink(platform: MetaPlatform, redirectUri: string): string | null {
  if (metaConnectState(platform) !== 'approved' || !metaEyiConfig.importService) return null;
  return buildMetaEyiDeepLink({ platform, importService: metaEyiConfig.importService, redirectUri });
}
