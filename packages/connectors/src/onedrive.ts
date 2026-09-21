import { mimeFromFilename } from './mime';
import { LiveSourceError, type LiveChanges, type LivePage, type LiveSourceClient } from './live';
import type { Fetcher } from './dropbox';
import type { DiscoveredItem } from './types';

const GRAPH = 'https://graph.microsoft.com/v1.0';
const DELTA = `${GRAPH}/me/drive/root/delta`;

interface GraphItem {
  id?: string;
  name?: string;
  size?: number;
  cTag?: string;
  lastModifiedDateTime?: string;
  file?: { mimeType?: string };
  folder?: unknown;
  deleted?: unknown;
}

function toItem(e: GraphItem): DiscoveredItem {
  const name = e.name ?? e.id ?? 'bestand';
  return {
    sourceItemId: e.id ?? name,
    filename: name,
    mimeType: e.file?.mimeType ?? mimeFromFilename(name),
    sizeBytes: e.size ?? 0,
    modifiedAtSource: e.lastModifiedDateTime,
    etag: e.cTag,
  };
}

/**
 * OneDrive (Microsoft Graph) live connector (verified 2026-09-19; see
 * docs/connectors/onedrive.md). Full enumeration AND incremental sync use the
 * delta query — persist the `@odata.deltaLink` as the cursor. Track items by
 * `id`; a stale token returns 410 → full resync (handled as transient here).
 */
export class OneDriveSourceClient implements LiveSourceClient {
  readonly connectorKey = 'onedrive';
  constructor(private readonly fetchImpl: Fetcher) {}

  private async get(
    url: string,
    token: string,
  ): Promise<{
    value?: GraphItem[];
    '@odata.nextLink'?: string;
    '@odata.deltaLink'?: string;
  }> {
    const res = await this.fetchImpl(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw await mapError(res);
    return res.json() as Promise<{
      value?: GraphItem[];
      '@odata.nextLink'?: string;
      '@odata.deltaLink'?: string;
    }>;
  }

  async listPage(accessToken: string, cursor?: string): Promise<LivePage> {
    const data = await this.get(cursor ?? DELTA, accessToken);
    const items = (data.value ?? []).filter((e) => e.file && !e.deleted).map(toItem);
    const nextCursor = data['@odata.nextLink'] ?? data['@odata.deltaLink'];
    return { items, nextCursor, done: !data['@odata.nextLink'] };
  }

  async fetchContent(accessToken: string, item: DiscoveredItem): Promise<Uint8Array> {
    // GET /content 302-redirects to a pre-authed URL; fetch follows it and drops
    // the Authorization header on the cross-origin hop (per the fetch spec).
    const res = await this.fetchImpl(
      `${GRAPH}/me/drive/items/${encodeURIComponent(item.sourceItemId)}/content`,
      { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) throw await mapError(res);
    return new Uint8Array(await res.arrayBuffer());
  }

  async getChanges(accessToken: string, cursor: string): Promise<LiveChanges> {
    const data = await this.get(cursor, accessToken);
    const added = (data.value ?? []).filter((e) => e.file && !e.deleted).map(toItem);
    const deletedSourceItemIds = (data.value ?? [])
      .filter((e) => e.deleted && e.id)
      .map((e) => e.id!);
    const nextCursor = data['@odata.deltaLink'] ?? data['@odata.nextLink'] ?? cursor;
    return { added, deletedSourceItemIds, nextCursor };
  }
}

async function mapError(res: {
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}): Promise<LiveSourceError> {
  const body = await res.text().catch(() => '');
  if (res.status === 429 || res.status === 503) {
    const ra = Number(res.headers.get('Retry-After'));
    return new LiveSourceError(
      'rate_limit',
      'OneDrive throttled',
      Number.isFinite(ra) ? ra * 1000 : undefined,
    );
  }
  if (res.status === 401) return new LiveSourceError('auth', 'OneDrive authorization invalid');
  if (res.status === 404) return new LiveSourceError('not_found', 'OneDrive item not found');
  if (res.status === 410)
    return new LiveSourceError('transient', 'OneDrive delta token expired (resync)');
  if (res.status >= 500) return new LiveSourceError('transient', `OneDrive ${res.status}`);
  return new LiveSourceError('permanent', `OneDrive ${res.status}: ${body.slice(0, 200)}`);
}
