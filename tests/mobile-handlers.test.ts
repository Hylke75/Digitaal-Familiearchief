import { describe, expect, it } from 'vitest';
import { contentStorageKey, sha256Hex } from '@dla/archive';
import {
  MobileError,
  beginUploadSession,
  completeUpload,
  reconcile,
  registerDevice,
  type IngestInput,
  type MobileDb,
  type MobileStorage,
} from '../apps/web/lib/mobile/handlers';

const USER = 'user-1';

function fakeDb(overrides: Partial<MobileDb> = {}) {
  const ingest: IngestInput[] = [];
  const reconcileCalls: Array<{ id: string; ids: string[] }> = [];
  const db: MobileDb = {
    findAccount: async () => null,
    createAccount: async () => ({ id: 'acc-new' }),
    accountBelongsToUser: async () => true,
    findItemByChecksum: async () => null,
    ingestItem: async (input) => {
      ingest.push(input);
      return { deduped: false };
    },
    reconcileSources: async (id, ids) => {
      reconcileCalls.push({ id, ids });
      return ids.length === 0 ? 3 : 1;
    },
    ...overrides,
  };
  return { db, ingest, reconcileCalls };
}

function fakeStorage(bytesByKey: Record<string, Uint8Array> = {}) {
  const created: string[] = [];
  const storage: MobileStorage = {
    fetch: async (key) => {
      const b = bytesByKey[key];
      if (!b) throw new Error('missing');
      return b;
    },
    createSignedUpload: async (key) => {
      created.push(key);
      return { uploadUrl: `https://up/${key}`, token: 'tok' };
    },
  };
  return { storage, created };
}

const ACC = '11111111-1111-1111-1111-111111111111';

describe('registerDevice', () => {
  it('creates a new apple_photos account and returns its id', async () => {
    const { db } = fakeDb();
    const out = await registerDevice(db, { deviceName: "Hylke's iPhone", platform: 'ios' });
    expect(out.connectorAccountId).toBe('acc-new');
  });

  it('is idempotent: an existing device returns the same account', async () => {
    const { db } = fakeDb({ findAccount: async () => ({ id: 'acc-existing' }) });
    const out = await registerDevice(db, { deviceName: 'iPhone', deviceId: 'vendor-123' });
    expect(out.connectorAccountId).toBe('acc-existing');
  });

  it('rejects a missing device name', async () => {
    const { db } = fakeDb();
    await expect(registerDevice(db, {})).rejects.toMatchObject({ code: 'invalid_request' });
  });
});

describe('beginUploadSession', () => {
  const checksum = sha256Hex(new TextEncoder().encode('photo-bytes'));
  const base = {
    connectorAccountId: ACC,
    sourceItemId: 'PHAsset-1',
    filename: 'IMG_0001.HEIC',
    mimeType: 'image/heic',
    sizeBytes: 11,
    checksumSha256: checksum,
  };

  it('returns a signed upload target for new content', async () => {
    const { db } = fakeDb();
    const { storage, created } = fakeStorage();
    const out = await beginUploadSession(db, storage, USER, base);
    expect(out.status).toBe('upload');
    const key = contentStorageKey(USER, checksum);
    expect(created).toContain(key);
    if (out.status === 'upload') expect(out.storageKey).toBe(key);
  });

  it('deduped content skips upload but still records the source link', async () => {
    const { db, ingest } = fakeDb({ findItemByChecksum: async () => ({ id: 'item-1' }) });
    const { storage, created } = fakeStorage();
    const out = await beginUploadSession(db, storage, USER, base);
    expect(out.status).toBe('exists');
    expect(created).toHaveLength(0);
    expect(ingest).toHaveLength(1);
    expect(ingest[0]?.storageKey).toBe(contentStorageKey(USER, checksum));
    expect(ingest[0]?.type).toBe('photo');
  });

  it('rejects an account the user does not own', async () => {
    const { db } = fakeDb({ accountBelongsToUser: async () => false });
    const { storage } = fakeStorage();
    await expect(beginUploadSession(db, storage, USER, base)).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('rejects a malformed checksum', async () => {
    const { db } = fakeDb();
    const { storage } = fakeStorage();
    await expect(
      beginUploadSession(db, storage, USER, { ...base, checksumSha256: 'nope' }),
    ).rejects.toMatchObject({ code: 'invalid_request' });
  });
});

describe('completeUpload', () => {
  const bytes = new TextEncoder().encode('the original bytes');
  const checksum = sha256Hex(bytes);
  const key = contentStorageKey(USER, checksum);
  const base = {
    connectorAccountId: ACC,
    sourceItemId: 'PHAsset-9',
    filename: 'IMG_0009.HEIC',
    mimeType: 'image/heic',
    checksumSha256: checksum,
    storageKey: key,
  };

  it('archives when stored bytes match the checksum', async () => {
    const { db, ingest } = fakeDb();
    const { storage } = fakeStorage({ [key]: bytes });
    const out = await completeUpload(db, storage, USER, base);
    expect(out).toEqual({ status: 'archived', deduped: false });
    expect(ingest[0]?.fileSize).toBe(bytes.byteLength);
  });

  it('rejects a checksum mismatch (never marks unsafe content archived)', async () => {
    const { db } = fakeDb();
    const { storage } = fakeStorage({ [key]: new TextEncoder().encode('tampered') });
    await expect(completeUpload(db, storage, USER, base)).rejects.toMatchObject({
      code: 'checksum_mismatch',
    });
  });

  it('rejects when the uploaded object is missing', async () => {
    const { db } = fakeDb();
    const { storage } = fakeStorage();
    await expect(completeUpload(db, storage, USER, base)).rejects.toMatchObject({
      code: 'storage_missing',
    });
  });

  it("rejects a storage key outside the caller's content address", async () => {
    const { db } = fakeDb();
    const { storage } = fakeStorage({ [key]: bytes });
    await expect(
      completeUpload(db, storage, USER, {
        ...base,
        storageKey: 'archive/someone-else/aa/deadbeef',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('reconcile', () => {
  it('returns the count of tombstoned sources', async () => {
    const { db, reconcileCalls } = fakeDb();
    const out = await reconcile(db, {
      connectorAccountId: ACC,
      presentSourceItemIds: ['a', 'b'],
    });
    expect(out).toEqual({ status: 'reconciled', deletedCount: 1 });
    expect(reconcileCalls[0]).toEqual({ id: ACC, ids: ['a', 'b'] });
  });

  it('rejects a non-array present list', async () => {
    const { db } = fakeDb();
    await expect(
      reconcile(db, { connectorAccountId: ACC, presentSourceItemIds: 'nope' }),
    ).rejects.toMatchObject({ code: 'invalid_request' });
  });

  it('rejects an account the user does not own', async () => {
    const { db } = fakeDb({ accountBelongsToUser: async () => false });
    await expect(
      reconcile(db, { connectorAccountId: ACC, presentSourceItemIds: [] }),
    ).rejects.toBeInstanceOf(MobileError);
  });
});
