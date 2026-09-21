import { TIKTOK_OAUTH } from '@dla/oauth';
import { TikTokPortabilityClient, type Fetcher, type PortabilityClient } from '@dla/connectors';
import { appUrl } from '@/lib/env';
import type { ConnectProvider } from './live-providers';

/**
 * Server-only registry of PORTABILITY (async export) providers that are fully
 * implemented AND configured. Same OAuth shape as live providers; the worker
 * drives the request→poll→download→parse state machine.
 */
export interface PortabilityProvider extends ConnectProvider {
  makePortabilityClient(): PortabilityClient;
}

const globalFetch = fetch as unknown as Fetcher;

const FACTORIES: Record<string, () => PortabilityProvider | undefined> = {
  tiktok() {
    const clientId = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    if (!clientId || !clientSecret) return undefined;
    return {
      key: 'tiktok',
      oauth: TIKTOK_OAUTH,
      credentialKind: 'refresh_token',
      makeClient: () => ({
        clientId,
        clientSecret,
        redirectUri: appUrl('/auth/tiktok/callback'),
      }),
      makePortabilityClient: () => new TikTokPortabilityClient(globalFetch),
    };
  },
};

export function getPortabilityProvider(key: string): PortabilityProvider | undefined {
  return FACTORIES[key]?.();
}

export function isPortabilityProviderConfigured(key: string): boolean {
  return getPortabilityProvider(key) !== undefined;
}
