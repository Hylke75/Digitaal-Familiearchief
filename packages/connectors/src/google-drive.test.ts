import { describe, expect, it } from 'vitest';
import { GoogleDriveSourceClient } from './google-drive';
import type { Fetcher } from './dropbox';

const ok = (body: unknown, bytes = 'x'): Awaited<ReturnType<Fetcher>> => ({
  ok: true,
  status: 200,
  headers: { get: () => null },
  json: async () => body,
  text: async () => '',
  arrayBuffer: async () => new TextEncoder().encode(bytes).buffer,
});

describe('GoogleDriveSourceClient', () => {
  it('lists files, skipping folders, and paginates', async () => {
    const fetchImpl: Fetcher = async (url) => {
      expect(url).toContain('trashed');
      return ok({
        files: [
          { id: 'f1', name: 'p.jpg', mimeType: 'image/jpeg', md5Checksum: 'm1', size: '100' },
          { id: 'd1', name: 'folder', mimeType: 'application/vnd.google-apps.folder' },
        ],
        nextPageToken: undefined,
      });
    };
    const gd = new GoogleDriveSourceClient(fetchImpl);
    const page = await gd.listPage('t');
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({ sourceItemId: 'f1', etag: 'm1', sizeBytes: 100 });
    expect(page.done).toBe(true);
  });

  it('exports Google-native docs and downloads blobs via alt=media', async () => {
    const urls: string[] = [];
    const fetchImpl: Fetcher = async (url) => {
      urls.push(url);
      return ok({}, 'bytes');
    };
    const gd = new GoogleDriveSourceClient(fetchImpl);
    await gd.fetchContent('t', {
      sourceItemId: 'doc1',
      filename: 'Doc',
      mimeType: 'application/vnd.google-apps.document',
      sizeBytes: 0,
    });
    await gd.fetchContent('t', {
      sourceItemId: 'img1',
      filename: 'p.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 5,
    });
    expect(urls[0]).toContain('/export?mimeType=');
    expect(urls[0]).toContain('wordprocessingml.document');
    expect(urls[1]).toContain('alt=media');
  });

  it('classifies a 403 rateLimitExceeded as rate_limit', async () => {
    const fetchImpl: Fetcher = async () => ({
      ok: false,
      status: 403,
      headers: { get: () => null },
      json: async () => ({}),
      text: async () => '{"error":{"errors":[{"reason":"rateLimitExceeded"}]}}',
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    await expect(new GoogleDriveSourceClient(fetchImpl).listPage('t')).rejects.toMatchObject({
      kind: 'rate_limit',
    });
  });
});
