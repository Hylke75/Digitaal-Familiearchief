import { describe, expect, it } from 'vitest';
import { MockArchiveConnector, type ArchiveConnector, type DiscoveredItem } from '@dla/connectors';
import { InMemoryStorageProvider } from '@dla/storage';
import { runImport, type ArchivePersistencePort } from './engine';

/** Minimal persistence fake that dedups on (owner, checksum). */
function fakePersistence() {
  const items = new Map<string, string>(); // owner+checksum -> itemId
  const sources: Array<{ checksum: string; sourceItemId: string }> = [];
  const port: ArchivePersistencePort = {
    async upsertItem(input) {
      const key = `${input.ownerId}:${input.checksumSha256}`;
      const deduped = items.has(key);
      if (!deduped) items.set(key, `item-${items.size + 1}`);
      sources.push({ checksum: input.checksumSha256, sourceItemId: input.sourceItemId });
      return { deduped };
    },
  };
  return { port, items, sources };
}

/** A tiny connector whose items share identical bytes, to exercise dedup. */
function duplicateConnector(): ArchiveConnector {
  const items: DiscoveredItem[] = [
    { sourceItemId: 'a', filename: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 4 },
    { sourceItemId: 'b', filename: 'b.jpg', mimeType: 'image/jpeg', sizeBytes: 4 },
  ];
  const bytes = new Uint8Array([1, 2, 3, 4]);
  return {
    capability: new MockArchiveConnector().capability,
    async connect() {},
    async disconnect() {},
    async validateConnection() {
      return true;
    },
    async discover() {
      return items;
    },
    async *initialImport() {
      for (const i of items) yield i;
    },
    async getChanges() {
      return { added: [], modified: [], deletedSourceItemIds: [] };
    },
    async *importChanges() {},
    async fetchContent() {
      return bytes; // identical for every item
    },
    async refreshAuthorization() {},
    async getStatus() {
      return { status: 'connected' };
    },
  };
}

describe('archive engine', () => {
  it('golden path: archives the whole mock library once', async () => {
    const storage = new InMemoryStorageProvider();
    const { port } = fakePersistence();
    const result = await runImport({
      connector: new MockArchiveConnector(),
      storage,
      persistence: port,
      ownerId: 'user-1',
      connectorAccountId: 'acc-1',
    });
    expect(result.discovered).toBe(150);
    expect(result.processed).toBe(150);
    expect(result.archived).toBe(150);
    expect(result.deduped).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.bytesProcessed).toBeGreaterThan(0);
  });

  it('is idempotent: re-running dedups every item, no duplicates', async () => {
    const storage = new InMemoryStorageProvider();
    const { port, items } = fakePersistence();
    const run = () =>
      runImport({
        connector: new MockArchiveConnector(),
        storage,
        persistence: port,
        ownerId: 'user-1',
        connectorAccountId: 'acc-1',
      });
    await run();
    const second = await run();
    expect(second.archived).toBe(0);
    expect(second.deduped).toBe(150);
    expect(items.size).toBe(150); // still exactly one item per unique binary
  });

  it('deduplicates identical binaries but keeps both source relationships (§22/§23)', async () => {
    const storage = new InMemoryStorageProvider();
    const { port, items, sources } = fakePersistence();
    const result = await runImport({
      connector: duplicateConnector(),
      storage,
      persistence: port,
      ownerId: 'user-1',
      connectorAccountId: 'acc-1',
    });
    expect(result.archived).toBe(1);
    expect(result.deduped).toBe(1);
    expect(items.size).toBe(1); // one physical item
    expect(sources).toHaveLength(2); // two source relationships retained
  });

  it('isolates a single item failure without aborting the import', async () => {
    const storage = new InMemoryStorageProvider();
    const { port } = fakePersistence();
    const base = new MockArchiveConnector();
    const items = (await base.discover()).slice(0, 5);
    const connector: ArchiveConnector = Object.assign(
      Object.create(Object.getPrototypeOf(base)),
      base,
      {
        async fetchContent(item: DiscoveredItem) {
          if (item.sourceItemId === 'photo-2') throw new Error('rate limited');
          return base.fetchContent(item);
        },
      },
    );
    const result = await runImport({
      connector,
      storage,
      persistence: port,
      ownerId: 'user-1',
      connectorAccountId: 'acc-1',
      items,
    });
    expect(result.discovered).toBe(5);
    expect(result.failed).toBe(1);
    expect(result.archived).toBe(4);
  });
});
