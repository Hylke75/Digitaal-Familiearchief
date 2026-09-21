import { describe, expect, it } from 'vitest';
import { TikTokPortabilityClient } from './tiktok';
import type { Fetcher } from './dropbox';

const res = (status: number, body: unknown, bytes?: string): Awaited<ReturnType<Fetcher>> => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => null },
  json: async () => body,
  text: async () => JSON.stringify(body),
  arrayBuffer: async () => new TextEncoder().encode(bytes ?? '').buffer,
});

describe('TikTokPortabilityClient', () => {
  it('requests an export and returns the request id', async () => {
    const fetchImpl: Fetcher = async (url, init) => {
      expect(url).toContain('/user/data/add/');
      expect(JSON.parse(init.body as string).category_selection_list).toEqual(['video', 'profile']);
      return res(200, { data: { request_id: 123451234512345 }, error: { code: 'ok' } });
    };
    const id = await new TikTokPortabilityClient(fetchImpl).requestExport('tok');
    expect(id).toBe('123451234512345');
  });

  it('maps status downloading→ready and expired→failed', async () => {
    const mk = (status: string) =>
      new TikTokPortabilityClient(async () => res(200, { data: { status } }));
    expect(await mk('downloading').checkStatus('t', '1')).toMatchObject({
      ready: true,
      failed: false,
    });
    expect(await mk('pending').checkStatus('t', '1')).toMatchObject({
      ready: false,
      failed: false,
    });
    expect(await mk('expired').checkStatus('t', '1')).toMatchObject({ ready: false, failed: true });
  });

  it('downloads the export as bytes', async () => {
    const client = new TikTokPortabilityClient(async (url) => {
      expect(url).toContain('/user/data/download/');
      return res(200, {}, 'zip-bytes');
    });
    const bytes = await client.downloadExport('t', '1');
    expect(new TextDecoder().decode(bytes)).toBe('zip-bytes');
  });
});
