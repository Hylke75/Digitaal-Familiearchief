import { archiveTypeFromMime, type ArchiveConnector, type DiscoveredItem } from '@dla/connectors';
import type { ArchiveStorageProvider } from '@dla/storage';
import { contentStorageKey, sha256Hex } from './checksum';
import type { ArchiveItemType } from './types';

/**
 * Persistence port (CLAUDE.md §20). The engine never talks to the database
 * directly; the app supplies an implementation (in this project a SECURITY
 * DEFINER RPC that writes owner-scoped rows). This keeps the engine provider-
 * and storage-backend-agnostic and unit-testable.
 */
export interface UpsertItemInput {
  ownerId: string;
  connectorAccountId: string;
  type: ArchiveItemType;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  checksumSha256: string;
  createdAtSource?: string;
  modifiedAtSource?: string;
  storageProvider: string;
  storageKey: string;
  sourceItemId: string;
  sourceUrlIfSafe?: string;
  /** Capture metadata retained in metadata_json (normalised subset derived server-side). */
  metadata?: Record<string, unknown>;
}

export interface ArchivePersistencePort {
  /**
   * Idempotently record an archived item + its source. Must dedup on
   * (ownerId, checksumSha256): returns `deduped: true` when the binary already
   * existed (only a new source relationship is added), never a duplicate item.
   */
  upsertItem(input: UpsertItemInput): Promise<{ deduped: boolean }>;
  /** Record that a source copy disappeared. The archived item is retained (§4). */
  markSourceDeleted?(
    ownerId: string,
    connectorAccountId: string,
    sourceItemId: string,
  ): Promise<void>;
}

export interface ImportResult {
  discovered: number;
  processed: number;
  archived: number;
  deduped: number;
  failed: number;
  bytesProcessed: number;
}

export interface RunImportArgs {
  connector: ArchiveConnector;
  storage: ArchiveStorageProvider;
  persistence: ArchivePersistencePort;
  ownerId: string;
  connectorAccountId: string;
  /** Optional discovered set (e.g. an incremental change set). Defaults to full discovery. */
  items?: DiscoveredItem[];
  /** Max items processed concurrently. Default 1 (deterministic). */
  concurrency?: number;
  onProgress?: (done: number, total: number) => void;
}

function itemType(mimeType: string): ArchiveItemType {
  return archiveTypeFromMime(mimeType) as ArchiveItemType;
}

/**
 * Run the archive pipeline for a set of discovered items:
 * FETCH → CHECKSUM → STORE ORIGINAL → PERSIST METADATA → CONFIRM.
 *
 * An item is only counted as archived once BOTH durable storage and metadata
 * succeed (CLAUDE.md §20, §72). The pass is idempotent: re-running never creates
 * duplicate archive records because storage keys are content-addressed and the
 * persistence port dedups on checksum.
 */
export async function runImport(args: RunImportArgs): Promise<ImportResult> {
  const { connector, storage, persistence, ownerId, connectorAccountId, onProgress } = args;
  const items = args.items ?? (await connector.discover());

  const result: ImportResult = {
    discovered: items.length,
    processed: 0,
    archived: 0,
    deduped: 0,
    failed: 0,
    bytesProcessed: 0,
  };

  let done = 0;

  const processOne = async (item: DiscoveredItem): Promise<void> => {
    try {
      const bytes = await connector.fetchContent(item);
      const checksum = sha256Hex(bytes);
      const key = contentStorageKey(ownerId, checksum);

      // Durable storage first; verifies the stored bytes match the checksum.
      await storage.put(key, bytes, { contentType: item.mimeType, checksumSha256: checksum });

      // Then metadata. Only now is the item considered safe.
      const { deduped } = await persistence.upsertItem({
        ownerId,
        connectorAccountId,
        type: itemType(item.mimeType),
        originalFilename: item.filename,
        mimeType: item.mimeType,
        fileSize: bytes.byteLength,
        checksumSha256: checksum,
        createdAtSource: item.createdAtSource,
        modifiedAtSource: item.modifiedAtSource,
        storageProvider: storage.id,
        storageKey: key,
        sourceItemId: item.sourceItemId,
        metadata: item.metadata,
      });

      result.processed += 1;
      result.bytesProcessed += bytes.byteLength;
      if (deduped) result.deduped += 1;
      else result.archived += 1;
    } catch {
      // A single item failing must never abort the whole import, and never
      // reports success. Errors are counted; details are logged by the caller.
      result.failed += 1;
    } finally {
      done += 1;
      onProgress?.(done, items.length);
    }
  };

  const concurrency = Math.max(1, args.concurrency ?? 1);
  if (concurrency === 1) {
    for (const item of items) await processOne(item);
  } else {
    // Simple worker pool: process items with bounded concurrency. Each item is
    // independent and idempotent, so ordering does not affect correctness.
    let cursor = 0;
    const worker = async () => {
      while (cursor < items.length) {
        const index = cursor++;
        await processOne(items[index]!);
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  }

  return result;
}
