import { describe, expect, it } from 'vitest';
import { DropboxSourceClient, type Fetcher } from './dropbox';
import { LiveSourceError } from './live';

function jsonRes(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Awaited<ReturnType<Fetcher>> {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (n: string) => headers[n] ?? null },
    json: async () => body,
    text: async () => JSON.stringify(body),
    arrayBuffer: async () => new TextEncoder().encode(String(body)).buffer,
  };
}

describe('DropboxSourceClient', () => {
  it('lists files across pages via the cursor', async () => {
    const calls: string[] = [];
    const fetchImpl: Fetcher = async (url, init) => {
      calls.push(url);
      if (url.endsWith('/files/list_folder')) {
        expect(JSON.parse(init.body as string)).toMatchObject({ path: '', recursive: true });
        return jsonRes(200, {
          entries: [
            { '.tag': 'file', id: 'id:1', name: 'a.jpg', size: 10, content_hash: 'h1' },
            { '.tag': 'folder', name: 'dir' },
          ],
          cursor: 'c1',
          has_more: true,
        });
      }
      return jsonRes(200, {
        entries: [{ '.tag': 'file', id: 'id:2', name: 'b.pdf', size: 20, content_hash: 'h2' }],
        cursor: 'c2',
        has_more: false,
      });
    };
    const dbx = new DropboxSourceClient(fetchImpl);

    const page1 = await dbx.listPage('tok');
    expect(page1.items).toHaveLength(1); // folder filtered out
    expect(page1.items[0]).toMatchObject({
      sourceItemId: 'id:1',
      mimeType: 'image/jpeg',
      etag: 'h1',
    });
    expect(page1.done).toBe(false);

    const page2 = await dbx.listPage('tok', page1.nextCursor);
    expect(page2.items[0]!.sourceItemId).toBe('id:2');
    expect(page2.done).toBe(true);
    expect(calls[1]).toContain('/files/list_folder/continue');
  });

  it('downloads content using the id identity on the content host', async () => {
    const fetchImpl: Fetcher = async (url, init) => {
      expect(url).toContain('content.dropboxapi.com');
      expect(JSON.parse(init.headers['Dropbox-API-Arg']!)).toEqual({ path: 'id:9' });
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({}),
        text: async () => '',
        arrayBuffer: async () => new TextEncoder().encode('bytes').buffer,
      };
    };
    const bytes = await new DropboxSourceClient(fetchImpl).fetchContent('tok', {
      sourceItemId: 'id:9',
      filename: 'x',
      mimeType: 'application/octet-stream',
      sizeBytes: 5,
    });
    expect(new TextDecoder().decode(bytes)).toBe('bytes');
  });

  it('classifies a 429 as rate_limit with Retry-After', async () => {
    const fetchImpl: Fetcher = async () =>
      jsonRes(429, { error: 'too_many' }, { 'Retry-After': '3' });
    try {
      await new DropboxSourceClient(fetchImpl).listPage('tok');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(LiveSourceError);
      expect((e as LiveSourceError).kind).toBe('rate_limit');
      expect((e as LiveSourceError).retryAfterMs).toBe(3000);
    }
  });
});
