import { describe, expect, it } from 'vitest';
import { MockArchiveConnector } from './mock';

describe('MockArchiveConnector', () => {
  it('discovers a stable library of 150 items', async () => {
    const c = new MockArchiveConnector();
    const items = await c.discover();
    expect(items).toHaveLength(150);
    expect(items.filter((i) => i.mimeType.startsWith('image/'))).toHaveLength(100);
    expect(items.filter((i) => i.mimeType.startsWith('video/'))).toHaveLength(20);
    expect(items.filter((i) => i.mimeType === 'application/pdf')).toHaveLength(30);
  });

  it('produces deterministic content of the declared size', async () => {
    const c = new MockArchiveConnector();
    const [first] = await c.discover();
    const a = await c.fetchContent(first!);
    const b = await c.fetchContent(first!);
    expect(a.byteLength).toBe(first!.sizeBytes);
    expect(a).toEqual(b);
  });

  it('reports action_required when authorization has expired', async () => {
    const c = new MockArchiveConnector({ authExpired: true });
    expect((await c.getStatus()).status).toBe('action_required');
    await c.refreshAuthorization();
    expect((await c.getStatus()).status).toBe('connected');
  });

  it('surfaces an outage as a temporary problem, never as deletion', async () => {
    const c = new MockArchiveConnector({ outage: true });
    expect(await c.validateConnection()).toBe(false);
    expect((await c.getStatus()).status).toBe('temporary_problem');
    await expect(c.discover()).rejects.toThrow();
  });
});
