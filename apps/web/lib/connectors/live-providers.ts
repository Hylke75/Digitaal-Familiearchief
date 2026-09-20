import { DROPBOX_OAUTH, type OAuthClient, type OAuthProviderConfig } from '@dla/oauth';
import { DropboxSourceClient, type Fetcher, type LiveSourceClient } from '@dla/connectors';
import { appUrl } from '@/lib/env';

/**
 * Server-only registry of LIVE (OAuth) providers that are fully implemented AND
 * configured (client id/secret present). The UI only offers "Koppelen" for
 * providers returned here, so a connector is never advertised as connectable
 * unless it can actually run. Google Drive / OneDrive OAuth configs exist in
 * @dla/oauth; they are added here once their source clients + credentials land.
 */
export interface LiveProvider {
  key: string;
  oauth: OAuthProviderConfig;
  credentialKind: 'refresh_token';
  makeClient(): OAuthClient;
  makeSourceClient(): LiveSourceClient;
}

const globalFetch = fetch as unknown as Fetcher;

const FACTORIES: Record<string, () => LiveProvider | undefined> = {
  dropbox() {
    const clientId = process.env.DROPBOX_CLIENT_ID;
    const clientSecret = process.env.DROPBOX_CLIENT_SECRET;
    if (!clientId || !clientSecret) return undefined;
    return {
      key: 'dropbox',
      oauth: DROPBOX_OAUTH,
      credentialKind: 'refresh_token',
      makeClient: () => ({
        clientId,
        clientSecret,
        redirectUri: appUrl('/auth/dropbox/callback'),
      }),
      makeSourceClient: () => new DropboxSourceClient(globalFetch),
    };
  },
};

export function getLiveProvider(key: string): LiveProvider | undefined {
  return FACTORIES[key]?.();
}

/** True when a live connector is fully implemented AND its credentials are set. */
export function isLiveProviderConfigured(key: string): boolean {
  return getLiveProvider(key) !== undefined;
}

/** Keys of all live providers with a source-client implementation (config aside). */
export const IMPLEMENTED_LIVE_KEYS = Object.keys(FACTORIES);
