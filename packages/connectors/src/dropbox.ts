import { mimeFromFilename } from './mime';
import { LiveSourceError, type LiveChanges, type LivePage, type LiveSourceClient } from './live';
import type { DiscoveredItem } from './types';

/** Minimal fetch shape (injected so the client is unit-testable). */
export type Fetcher = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string | Uint8Array | null;
  },
) => Promise<{
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}>;

const API = 'https://api.dropboxapi.com/2';
const CONTENT = 'https://content.dropboxapi.com/2';

interface DbxFile {
  '.tag': string;
  id?: string;
  name?: string;
  size?: number;
  server_modified?: string;
  content_hash?: string;
}

function toItem(e: DbxFile): DiscoveredItem {
  const name = e.name ?? e.id ?? 'bestand';
  return {
    sourceItemId: e.id ?? name,
    filename: name,
    mimeType: mimeFromFilename(name),
    sizeBytes: e.size ?? 0,
    modifiedAtSource: e.server_modified,
    etag: e.content_hash,
  };
}

/**
 * Dropbox live connector (verified 2026-09-19; see docs/connectors/dropbox.md).
 * Full + incremental listing via `list_folder` + `continue` cursor; download on
 * the content host using the stable `id:` identity. The worker supplies a fresh
 * access token; OAuth/refresh is handled outside this client.
 */
export class DropboxSourceClient implements LiveSourceClient {
  readonly connectorKey = 'dropbox';
  constructor(private readonly fetchImpl: Fetcher) {}

  private async postJson(url: string, token: string, body: unknown) {
    const res = await this.fetchImpl(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await mapError(res);
    return res.json();
  }

  async listPage(accessToken: string, cursor?: string): Promise<LivePage> {
    const data = (await (cursor
      ? this.postJson(`${API}/files/list_folder/continue`, accessToken, { cursor })
      : this.postJson(`${API}/files/list_folder`, accessToken, {
          path: '',
          recursive: true,
          include_deleted: false,
          include_mounted_folders: true,
        }))) as { entries?: DbxFile[]; cursor?: string; has_more?: boolean };

    const items = (data.entries ?? []).filter((e) => e['.tag'] === 'file').map(toItem);
    return { items, nextCursor: data.cursor, done: !data.has_more };
  }

  async fetchContent(accessToken: string, item: DiscoveredItem): Promise<Uint8Array> {
    const res = await this.fetchImpl(`${CONTENT}/files/download`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({ path: item.sourceItemId }),
      },
      body: null,
    });
    if (!res.ok) throw await mapError(res);
    return new Uint8Array(await res.arrayBuffer());
  }

  async getChanges(accessToken: string, cursor: string): Promise<LiveChanges> {
    const data = (await this.postJson(`${API}/files/list_folder/continue`, accessToken, {
      cursor,
    })) as { entries?: DbxFile[]; cursor?: string };
    const added = (data.entries ?? []).filter((e) => e['.tag'] === 'file').map(toItem);
    // DeletedMetadata has no id; deletion reconciliation by path is handled by a
    // later reconciliation pass, not here (see docs/connectors/dropbox.md).
    return { added, deletedSourceItemIds: [], nextCursor: data.cursor ?? cursor };
  }
}

async function mapError(res: {
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}): Promise<LiveSourceError> {
  const body = await res.text().catch(() => '');
  if (res.status === 429) {
    const ra = Number(res.headers.get('Retry-After'));
    return new LiveSourceError(
      'rate_limit',
      'Dropbox rate limited',
      Number.isFinite(ra) ? ra * 1000 : undefined,
    );
  }
  if (res.status === 401) return new LiveSourceError('auth', 'Dropbox authorization invalid');
  if (res.status === 409) {
    return /not_found/.test(body)
      ? new LiveSourceError('not_found', 'Dropbox path not found')
      : new LiveSourceError('permanent', `Dropbox 409: ${body.slice(0, 200)}`);
  }
  if (res.status >= 500) return new LiveSourceError('transient', `Dropbox ${res.status}`);
  return new LiveSourceError('permanent', `Dropbox ${res.status}: ${body.slice(0, 200)}`);
}
