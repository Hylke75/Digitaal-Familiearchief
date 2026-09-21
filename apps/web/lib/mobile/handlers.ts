import { archiveTypeFromMime } from '@dla/connectors';
import { contentStorageKey, sha256Hex, type ArchiveItemType } from '@dla/archive';

/**
 * Core logic for the mobile upload API (docs/mobile/apple-photos.md). Pure and
 * transport-agnostic: it operates on the small {@link MobileDb} / {@link
 * MobileStorage} ports so it is unit-testable with fakes, and the route
 * handlers wire the real Supabase-backed adapters. Every archive write still
 * goes through the vetted `archive_ingest_item` RPC (owner-scoped, dedups on
 * checksum), and source deletions never remove archived copies (§4).
 */

export type MobileErrorCode =
  'invalid_request' | 'not_found' | 'forbidden' | 'checksum_mismatch' | 'storage_missing';

const STATUS: Record<MobileErrorCode, number> = {
  invalid_request: 400,
  not_found: 404,
  forbidden: 403,
  checksum_mismatch: 422,
  storage_missing: 404,
};

/** A typed, safe-to-return error (never leaks provider/internal detail, §51). */
export class MobileError extends Error {
  readonly code: MobileErrorCode;
  readonly status: number;
  constructor(code: MobileErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'MobileError';
    this.code = code;
    this.status = STATUS[code];
  }
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

/** Data port — every method is already scoped to the authenticated user. */
export interface MobileDb {
  findAccount(
    connectorKey: string,
    providerAccountIdentifier: string,
  ): Promise<{ id: string } | null>;
  createAccount(input: {
    connectorKey: string;
    displayName: string;
    providerAccountIdentifier: string;
  }): Promise<{ id: string }>;
  accountBelongsToUser(accountId: string): Promise<boolean>;
  findItemByChecksum(checksum: string): Promise<{ id: string } | null>;
  ingestItem(input: IngestInput): Promise<{ deduped: boolean }>;
  reconcileSources(accountId: string, presentSourceItemIds: string[]): Promise<number>;
}

export interface MobileStorage {
  fetch(key: string): Promise<Uint8Array>;
  createSignedUpload(key: string): Promise<{ uploadUrl: string; token: string }>;
}

// --- validation -------------------------------------------------------------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;

function str(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new MobileError('invalid_request', `missing or empty: ${field}`);
  }
  return value;
}
function uuid(value: unknown, field: string): string {
  const s = str(value, field);
  if (!UUID.test(s)) throw new MobileError('invalid_request', `not a uuid: ${field}`);
  return s;
}
function sha256(value: unknown, field: string): string {
  const s = str(value, field).toLowerCase();
  if (!SHA256.test(s)) throw new MobileError('invalid_request', `not a sha-256 hex: ${field}`);
  return s;
}
function size(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new MobileError('invalid_request', `not a non-negative number: ${field}`);
  }
  return value;
}
function optIso(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  const s = str(value, field);
  if (Number.isNaN(Date.parse(s))) throw new MobileError('invalid_request', `not a date: ${field}`);
  return s;
}

// --- handlers ---------------------------------------------------------------

/**
 * Register (or refresh) a device as an `apple_photos` connector account.
 * Idempotent per (user, device): a stable device identifier maps to exactly one
 * account, so re-registration returns the same id.
 * Body: `{ deviceName, platform?, model?, deviceId? }`.
 */
export async function registerDevice(
  db: MobileDb,
  input: Record<string, unknown>,
): Promise<{ connectorAccountId: string }> {
  const deviceName = str(input.deviceName, 'deviceName').trim();
  const identifier = (
    typeof input.deviceId === 'string' && input.deviceId.trim() !== '' ? input.deviceId : deviceName
  ).trim();

  const existing = await db.findAccount('apple_photos', identifier);
  if (existing) return { connectorAccountId: existing.id };

  const created = await db.createAccount({
    connectorKey: 'apple_photos',
    displayName: deviceName,
    providerAccountIdentifier: identifier,
  });
  return { connectorAccountId: created.id };
}

export type SessionResult =
  { status: 'exists' } | { status: 'upload'; uploadUrl: string; token: string; storageKey: string };

/**
 * Begin an upload. If the owner already has an item with this checksum, the
 * bytes are already safe — record the (possibly new) source relationship and
 * tell the app to skip the upload. Otherwise return a one-time signed upload
 * target for the content-addressed key.
 */
export async function beginUploadSession(
  db: MobileDb,
  storage: MobileStorage,
  userId: string,
  input: Record<string, unknown>,
): Promise<SessionResult> {
  const connectorAccountId = uuid(input.connectorAccountId, 'connectorAccountId');
  const sourceItemId = str(input.sourceItemId, 'sourceItemId');
  const filename = str(input.filename, 'filename');
  const mimeType = str(input.mimeType, 'mimeType');
  const sizeBytes = size(input.sizeBytes, 'sizeBytes');
  const checksum = sha256(input.checksumSha256, 'checksumSha256');
  const createdAtSource = optIso(input.createdAtSource, 'createdAtSource');

  if (!(await db.accountBelongsToUser(connectorAccountId))) {
    throw new MobileError('not_found', 'connector account not found for user');
  }

  const key = contentStorageKey(userId, checksum);
  const existing = await db.findItemByChecksum(checksum);
  if (existing) {
    await db.ingestItem({
      connectorAccountId,
      type: archiveTypeFromMime(mimeType),
      originalFilename: filename,
      mimeType,
      fileSize: sizeBytes,
      checksumSha256: checksum,
      storageProvider: 'supabase',
      storageKey: key,
      sourceItemId,
      createdAtSource,
    });
    return { status: 'exists' };
  }

  const { uploadUrl, token } = await storage.createSignedUpload(key);
  return { status: 'upload', uploadUrl, token, storageKey: key };
}

/**
 * Finalize an upload: verify the stored bytes match the promised checksum, then
 * record the archive item + source through the vetted RPC. Only after this does
 * the asset count as safe (§72).
 * Body: `{ connectorAccountId, sourceItemId, filename, mimeType, checksumSha256, storageKey, createdAtSource? }`.
 */
export async function completeUpload(
  db: MobileDb,
  storage: MobileStorage,
  userId: string,
  input: Record<string, unknown>,
): Promise<{ status: 'archived'; deduped: boolean }> {
  const connectorAccountId = uuid(input.connectorAccountId, 'connectorAccountId');
  const sourceItemId = str(input.sourceItemId, 'sourceItemId');
  const filename = str(input.filename, 'filename');
  const mimeType = str(input.mimeType, 'mimeType');
  const checksum = sha256(input.checksumSha256, 'checksumSha256');
  const storageKey = str(input.storageKey, 'storageKey');
  const createdAtSource = optIso(input.createdAtSource, 'createdAtSource');

  // The key must live under the caller's own folder and match the content
  // address for this checksum — this blocks referencing another user's object.
  if (storageKey !== contentStorageKey(userId, checksum)) {
    throw new MobileError('forbidden', 'storage key does not match owner/checksum');
  }
  if (!(await db.accountBelongsToUser(connectorAccountId))) {
    throw new MobileError('not_found', 'connector account not found for user');
  }

  let bytes: Uint8Array;
  try {
    bytes = await storage.fetch(storageKey);
  } catch {
    throw new MobileError('storage_missing', 'uploaded object not found');
  }
  if (sha256Hex(bytes) !== checksum) {
    throw new MobileError('checksum_mismatch', 'stored bytes do not match checksum');
  }

  const { deduped } = await db.ingestItem({
    connectorAccountId,
    type: archiveTypeFromMime(mimeType),
    originalFilename: filename,
    mimeType,
    fileSize: bytes.byteLength,
    checksumSha256: checksum,
    storageProvider: 'supabase',
    storageKey,
    sourceItemId,
    createdAtSource,
  });
  return { status: 'archived', deduped };
}

/**
 * Mark sources whose assets left the device as deleted (source_deleted_at). The
 * archived copies are always retained (§4).
 * Body: `{ connectorAccountId, presentSourceItemIds: string[] }`.
 */
export async function reconcile(
  db: MobileDb,
  input: Record<string, unknown>,
): Promise<{ status: 'reconciled'; deletedCount: number }> {
  const connectorAccountId = uuid(input.connectorAccountId, 'connectorAccountId');
  if (
    !Array.isArray(input.presentSourceItemIds) ||
    !input.presentSourceItemIds.every((v) => typeof v === 'string')
  ) {
    throw new MobileError('invalid_request', 'presentSourceItemIds must be a string array');
  }
  if (!(await db.accountBelongsToUser(connectorAccountId))) {
    throw new MobileError('not_found', 'connector account not found for user');
  }
  const deletedCount = await db.reconcileSources(
    connectorAccountId,
    input.presentSourceItemIds as string[],
  );
  return { status: 'reconciled', deletedCount };
}
