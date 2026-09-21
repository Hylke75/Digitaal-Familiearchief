import { describe, expect, it } from 'vitest';
import { OneDriveSourceClient } from './onedrive';
import type { Fetcher } from './dropbox';
import { LiveSourceError } from './live';

const ok = (body: unknown): Awaited<ReturnType<Fetcher>> => ({
  ok: true,
  status: 200,
  headers: { get: () => null },
  json: async () => body,
  text: async () => '',
  arrayBuffer: async () => new TextEncoder().encode('x').buffer,
});

describe('OneDriveSourceClient', () => {
  it('enumerates files via delta and finishes on deltaLink', async () => {
    const fetchImpl: Fetcher = async (url) => {
      if (url.endsWith('/root/delta')) {
        return ok({
          value: [
            { id: '1', name: 'a.png', size: 3, file: { mimeType: 'image/png' }, cTag: 'c1' },
            { id: '2', name: 'dir', folder: {} },
          ],
          '@odata.nextLink': 'https://graph.microsoft.com/next',
        });
      }
      return ok({
        value: [{ id: '3', name: 'b.pdf', file: { mimeType: 'application/pdf' } }],
        '@odata.deltaLink': 'https://graph/delta?token=z',
      });
    };
    const od = new OneDriveSourceClient(fetchImpl);
    const p1 = await od.listPage('t');
    expect(p1.items).toHaveLength(1); // folder skipped
    expect(p1.items[0]).toMatchObject({ sourceItemId: '1', mimeType: 'image/png', etag: 'c1' });
    expect(p1.done).toBe(false);
    const p2 = await od.listPage('t', p1.nextCursor);
    expect(p2.done).toBe(true);
    expect(p2.nextCursor).toContain('delta?token=z');
  });

  it('reports deletions in getChanges', async () => {
    const fetchImpl: Fetcher = async () =>
      ok({
        value: [
          { id: '9', name: 'c.jpg', file: { mimeType: 'image/jpeg' } },
          { id: '10', deleted: {} },
        ],
        '@odata.deltaLink': 'd2',
      });
    const changes = await new OneDriveSourceClient(fetchImpl).getChanges('t', 'd1');
    expect(changes.added.map((i) => i.sourceItemId)).toEqual(['9']);
    expect(changes.deletedSourceItemIds).toEqual(['10']);
  });

  it('classifies 503 as rate_limit with Retry-After', async () => {
    const fetchImpl: Fetcher = async () => ({
      ok: false,
      status: 503,
      headers: { get: (n: string) => (n === 'Retry-After' ? '5' : null) },
      json: async () => ({}),
      text: async () => 'throttled',
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    await expect(new OneDriveSourceClient(fetchImpl).listPage('t')).rejects.toMatchObject({
      kind: 'rate_limit',
      retryAfterMs: 5000,
    } satisfies Partial<LiveSourceError>);
  });
});
