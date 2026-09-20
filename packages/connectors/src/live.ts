import type { DiscoveredItem } from './types';

/**
 * Live source client — the contract every OAuth "live" connector (Google Drive,
 * OneDrive, Dropbox) implements for the background worker. Kept separate from the
 * in-memory {@link ArchiveConnector} because live sources are paged and huge:
 * discovery yields pages (seeded into the job queue) and content is fetched
 * per-item, never all at once. An access token (already refreshed by the worker)
 * is passed in; the client does not manage OAuth itself.
 */
export interface LivePage {
  items: DiscoveredItem[];
  /** Opaque provider cursor to resume discovery, or continue incrementally. */
  nextCursor?: string;
  done: boolean;
}

export interface LiveChanges {
  added: DiscoveredItem[];
  deletedSourceItemIds: string[];
  nextCursor: string;
}

/** Classified provider error so the worker can apply the outage-vs-deletion rule. */
export type LiveErrorKind = 'rate_limit' | 'auth' | 'not_found' | 'transient' | 'permanent';

export class LiveSourceError extends Error {
  constructor(
    readonly kind: LiveErrorKind,
    message: string,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'LiveSourceError';
  }
}

export interface LiveSourceClient {
  readonly connectorKey: string;
  /** Page through the full library. Pass the previous `nextCursor` to continue. */
  listPage(accessToken: string, cursor?: string): Promise<LivePage>;
  /** Download the original bytes for one item. */
  fetchContent(accessToken: string, item: DiscoveredItem): Promise<Uint8Array>;
  /** Incremental changes since a stored cursor. */
  getChanges(accessToken: string, cursor: string): Promise<LiveChanges>;
}
