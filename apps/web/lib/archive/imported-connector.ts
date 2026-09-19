import type { ArchiveConnector, ConnectorCapability, DiscoveredItem } from '@dla/connectors';
import type { ImportedItem } from '@dla/import';

/**
 * Wraps a set of items parsed from an uploaded archive as an ArchiveConnector,
 * so the same archive engine (checksum → store → dedup → persist, idempotent)
 * handles uploads exactly like a live source. Content is served from memory.
 */
export function makeImportedConnector(
  capability: ConnectorCapability,
  items: ImportedItem[],
): ArchiveConnector {
  const byId = new Map(items.map((i) => [i.sourceItemId, i.bytes]));
  const discovered: DiscoveredItem[] = items.map((i) => ({
    sourceItemId: i.sourceItemId,
    filename: i.filename,
    mimeType: i.mimeType,
    sizeBytes: i.bytes.byteLength,
    createdAtSource: i.createdAtSource,
  }));

  return {
    capability,
    async connect() {},
    async disconnect() {},
    async validateConnection() {
      return true;
    },
    async discover() {
      return discovered;
    },
    async *initialImport() {
      for (const d of discovered) yield d;
    },
    async getChanges() {
      return { added: [], modified: [], deletedSourceItemIds: [] };
    },
    async *importChanges() {},
    async fetchContent(item) {
      const bytes = byId.get(item.sourceItemId);
      if (!bytes) throw new Error(`missing content for ${item.sourceItemId}`);
      return bytes;
    },
    async refreshAuthorization() {},
    async getStatus() {
      return { status: 'healthy' };
    },
  };
}
