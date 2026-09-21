import { contentStorageKey, sha256Hex, type ArchiveItemType } from '@dla/archive';
import { adaptMediaItem, adaptSocialPost } from './adapter';

/**
 * Meta EYI ingestion (docs/connectors/meta-eyi.md §14, §17). Pure and
 * transport-agnostic: the importer routes and the mock harness both feed
 * transfer items through here. Idempotent by design — bytes are content-
 * addressed and archived via the vetted ingest RPC, so a recurring full export
 * never duplicates (day 2's 10 010 items → 10 000 existing + 10 new). Source
 * deletion never removes the archived copy (that is the RPC's contract, §28).
 */
export interface TransferItem {
  endpoint: 'photos' | 'videos' | 'media' | 'social-posts';
  meta: Record<string, unknown>;
  bytes?: Uint8Array;
}

export interface IngestInput {
  connectorAccountId: string;
  type: ArchiveItemType;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  checksumSha256: string;
  storageProvider: string;
  storageKey: string;
  sourceItemId: string;
  createdAtSource?: string;
}

export interface MetaIngestPort {
  putBytes(key: string, bytes: Uint8Array, mimeType: string, checksum: string): Promise<void>;
  ingest(input: IngestInput): Promise<{ deduped: boolean }>;
}

export type IngestOutcome = 'new' | 'duplicate' | 'failed';

export async function ingestTransferItem(
  port: MetaIngestPort,
  userId: string,
  connectorAccountId: string,
  item: TransferItem,
): Promise<IngestOutcome> {
  let bytes: Uint8Array;
  let type: ArchiveItemType;
  let filename: string;
  let mimeType: string;
  let sourceItemId: string;
  let createdAtSource: string | undefined;

  if (item.endpoint === 'social-posts') {
    const a = adaptSocialPost(item.meta);
    if (!a.sourceItemId) return 'failed';
    bytes = new TextEncoder().encode(JSON.stringify(item.meta.payload ?? item.meta));
    type = a.type;
    filename = `${a.filename || 'bericht'}.json`;
    mimeType = 'application/json';
    sourceItemId = a.sourceItemId;
    createdAtSource = a.createdAtSource;
  } else {
    if (!item.bytes || item.bytes.byteLength === 0) return 'failed';
    const a = adaptMediaItem(item.meta, {
      filename: 'bestand',
      mimeType: item.endpoint === 'videos' ? 'video/mp4' : 'image/jpeg',
      sourceItemId: '',
    });
    if (!a.sourceItemId) return 'failed';
    bytes = item.bytes;
    type = a.type;
    filename = a.filename;
    mimeType = a.mimeType;
    sourceItemId = a.sourceItemId;
    createdAtSource = a.createdAtSource;
  }

  const checksum = sha256Hex(bytes);
  const key = contentStorageKey(userId, checksum);
  await port.putBytes(key, bytes, mimeType, checksum);
  const { deduped } = await port.ingest({
    connectorAccountId,
    type,
    originalFilename: filename,
    mimeType,
    fileSize: bytes.byteLength,
    checksumSha256: checksum,
    storageProvider: 'supabase',
    storageKey: key,
    sourceItemId,
    createdAtSource,
  });
  return deduped ? 'duplicate' : 'new';
}
