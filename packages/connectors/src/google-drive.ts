import { LiveSourceError, type LiveChanges, type LivePage, type LiveSourceClient } from './live';
import type { Fetcher } from './dropbox';
import type { DiscoveredItem } from './types';

const DRIVE = 'https://www.googleapis.com/drive/v3';
const FOLDER = 'application/vnd.google-apps.folder';
const NATIVE_PREFIX = 'application/vnd.google-apps.';

/** Export map for Google-native docs (files.export; ≤10 MB). */
const EXPORT_MAP: Record<string, string> = {
  'application/vnd.google-apps.document':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.google-apps.spreadsheet':
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.google-apps.presentation':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.google-apps.drawing': 'application/pdf',
};

interface GFile {
  id?: string;
  name?: string;
  mimeType?: string;
  md5Checksum?: string;
  size?: string;
  modifiedTime?: string;
  trashed?: boolean;
}

function toItem(f: GFile): DiscoveredItem {
  const name = f.name ?? f.id ?? 'bestand';
  return {
    sourceItemId: f.id ?? name,
    filename: name,
    mimeType: f.mimeType ?? 'application/octet-stream',
    sizeBytes: f.size ? Number(f.size) : 0,
    modifiedAtSource: f.modifiedTime,
    etag: f.md5Checksum,
  };
}

/**
 * Google Drive live connector (verified 2026-09-19; see docs/connectors/google-drive.md).
 * Full crawl via files.list; incremental via the Changes API. Blobs download
 * with alt=media; Google-native docs export to Office/PDF (≤10 MB). Requires the
 * restricted `drive.readonly` scope (verification + CASA) for full archival.
 */
export class GoogleDriveSourceClient implements LiveSourceClient {
  readonly connectorKey = 'google_drive';
  constructor(private readonly fetchImpl: Fetcher) {}

  private async getJson(url: string, token: string): Promise<unknown> {
    const res = await this.fetchImpl(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw await mapError(res);
    return res.json();
  }

  async listPage(accessToken: string, cursor?: string): Promise<LivePage> {
    const params = new URLSearchParams({
      q: 'trashed = false',
      pageSize: '1000',
      fields: 'nextPageToken, files(id, name, mimeType, md5Checksum, size, modifiedTime)',
      spaces: 'drive',
    });
    if (cursor) params.set('pageToken', cursor);
    const data = (await this.getJson(`${DRIVE}/files?${params.toString()}`, accessToken)) as {
      nextPageToken?: string;
      files?: GFile[];
    };
    const items = (data.files ?? []).filter((f) => f.mimeType !== FOLDER).map(toItem);
    return { items, nextCursor: data.nextPageToken, done: !data.nextPageToken };
  }

  async fetchContent(accessToken: string, item: DiscoveredItem): Promise<Uint8Array> {
    const id = encodeURIComponent(item.sourceItemId);
    const isNative = item.mimeType.startsWith(NATIVE_PREFIX);
    const url = isNative
      ? `${DRIVE}/files/${id}/export?mimeType=${encodeURIComponent(
          EXPORT_MAP[item.mimeType] ?? 'application/pdf',
        )}`
      : `${DRIVE}/files/${id}?alt=media`;
    const res = await this.fetchImpl(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw await mapError(res);
    return new Uint8Array(await res.arrayBuffer());
  }

  /** Initial cursor for incremental syncs (changes.getStartPageToken). */
  async initialSyncCursor(accessToken: string): Promise<string | undefined> {
    const data = (await this.getJson(`${DRIVE}/changes/startPageToken`, accessToken)) as {
      startPageToken?: string;
    };
    return data.startPageToken ?? undefined;
  }

  async getChanges(accessToken: string, cursor: string): Promise<LiveChanges> {
    const params = new URLSearchParams({
      pageToken: cursor,
      pageSize: '1000',
      includeRemoved: 'true',
      fields:
        'newStartPageToken, nextPageToken, changes(fileId, removed, file(id, name, mimeType, md5Checksum, size, modifiedTime, trashed))',
    });
    const data = (await this.getJson(`${DRIVE}/changes?${params.toString()}`, accessToken)) as {
      newStartPageToken?: string;
      nextPageToken?: string;
      changes?: { fileId?: string; removed?: boolean; file?: GFile }[];
    };
    const changes = data.changes ?? [];
    const added = changes
      .filter((c) => c.file && !c.removed && !c.file.trashed && c.file.mimeType !== FOLDER)
      .map((c) => toItem(c.file!));
    const deletedSourceItemIds = changes
      .filter((c) => (c.removed || c.file?.trashed) && c.fileId)
      .map((c) => c.fileId!);
    const nextCursor = data.nextPageToken ?? data.newStartPageToken ?? cursor;
    return { added, deletedSourceItemIds, nextCursor };
  }
}

async function mapError(res: {
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}): Promise<LiveSourceError> {
  const body = await res.text().catch(() => '');
  if (res.status === 429 || (res.status === 403 && /rateLimitExceeded/i.test(body))) {
    const ra = Number(res.headers.get('Retry-After'));
    return new LiveSourceError(
      'rate_limit',
      'Google rate limited',
      Number.isFinite(ra) ? ra * 1000 : undefined,
    );
  }
  if (res.status === 401) return new LiveSourceError('auth', 'Google authorization invalid');
  if (res.status === 404) return new LiveSourceError('not_found', 'Google file not found');
  if (res.status >= 500) return new LiveSourceError('transient', `Google ${res.status}`);
  return new LiveSourceError('permanent', `Google ${res.status}: ${body.slice(0, 200)}`);
}
