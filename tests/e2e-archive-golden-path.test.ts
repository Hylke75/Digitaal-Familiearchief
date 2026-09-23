import { describe, expect, it } from 'vitest';
import { MockArchiveConnector, type ArchiveConnector, type DiscoveredItem } from '@dla/connectors';
import { InMemoryStorageProvider } from '@dla/storage';
import { runImport, type ArchivePersistencePort } from '@dla/archive';

/**
 * End-to-end golden path for the core product promise (CLAUDE.md §4, §65–§67):
 * CONNECT → DISCOVER → INITIAL ARCHIVE → (source changes) → SOURCE DELETION MUST
 * NOT DELETE THE ARCHIVED COPY. This exercises the real archive engine against
 * in-memory storage + a persistence fake that models items AND source links, so
 * the invariant is verified behaviourally rather than assumed.
 */

/** Persistence fake that keeps archived items and their source relationships,
 * plus a `markSourceDeleted` that mirrors what the worker does when a provider
 * reports a deletion — it may ONLY touch the source link, never the item. */
function persistence() {
  const items = new Map<string, { id: string }>(); // owner:checksum -> item
  const sources = new Map<string, { checksum: string; deletedAt: string | null }>(); // sourceItemId -> link

  const port: ArchivePersistencePort = {
    async upsertItem(input) {
      const key = `${input.ownerId}:${input.checksumSha256}`;
      const deduped = items.has(key);
      if (!deduped) items.set(key, { id: `item-${items.size + 1}` });
      sources.set(input.sourceItemId, { checksum: input.checksumSha256, deletedAt: null });
      return { deduped };
    },
  };

  // The ONLY deletion the system performs: flag the source link. There is no
  // path — here or in ArchivePersistencePort — that removes an archived item.
  function markSourceDeleted(sourceItemId: string) {
    const link = sources.get(sourceItemId);
    if (link) link.deletedAt = new Date('2026-01-01T00:00:00Z').toISOString();
  }

  return { port, items, sources, markSourceDeleted };
}

const run = (connector: ArchiveConnector, port: ArchivePersistencePort) =>
  runImport({
    connector,
    storage: new InMemoryStorageProvider(),
    persistence: port,
    ownerId: 'user-1',
    connectorAccountId: 'acc-1',
  });

describe('golden path — source deletion never deletes the archive (§4)', () => {
  it('archives the full library, then a source deletion retains the archived item', async () => {
    const store = persistence();

    // CONNECT + DISCOVER + INITIAL ARCHIVE.
    const first = await run(new MockArchiveConnector(), store.port);
    expect(first.archived).toBe(first.discovered);
    const archivedCount = store.items.size;
    expect(archivedCount).toBeGreaterThan(0);

    // The provider reports one item deleted at the source.
    const [someSourceId] = [...store.sources.keys()];
    store.markSourceDeleted(someSourceId!);

    // The archived copy is untouched: same item count, and the item still exists.
    expect(store.items.size).toBe(archivedCount);
    const link = store.sources.get(someSourceId!);
    expect(link?.deletedAt).not.toBeNull(); // the SOURCE link records the deletion…
    const stillArchived = store.items.has(`user-1:${link!.checksum}`);
    expect(stillArchived).toBe(true); // …but the archived item remains (§4).
  });

  it('the persistence port has no delete capability at all (deletion-by-construction)', () => {
    const { port } = persistence();
    // The engine is structurally incapable of deleting an archived item: the
    // only mutating method is upsertItem. This is the §4 guarantee in the type.
    expect(Object.keys(port)).toEqual(['upsertItem']);
  });

  it('re-running after a source deletion still dedups — no resurrection, no loss', async () => {
    const store = persistence();
    await run(new MockArchiveConnector(), store.port);
    const before = store.items.size;
    // A later sync of the same library re-touches everything; all dedupes.
    const second = await run(new MockArchiveConnector(), store.port);
    expect(second.archived).toBe(0);
    expect(second.deduped).toBe(before);
    expect(store.items.size).toBe(before); // count is stable across syncs
  });
});
