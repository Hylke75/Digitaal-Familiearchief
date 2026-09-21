import { getLiveProvider, isLiveProviderConfigured, type ConnectProvider } from './live-providers';
import { getPortabilityProvider, isPortabilityProviderConfigured } from './portability-providers';

/** Resolve any connectable provider (live OR portability) for the OAuth routes. */
export function getConnectProvider(key: string): ConnectProvider | undefined {
  return getLiveProvider(key) ?? getPortabilityProvider(key);
}

/** True when a provider can be connected now (implemented + credentials present). */
export function isConnectProviderConfigured(key: string): boolean {
  return isLiveProviderConfigured(key) || isPortabilityProviderConfigured(key);
}
