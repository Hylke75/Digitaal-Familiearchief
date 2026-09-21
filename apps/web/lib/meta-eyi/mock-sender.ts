import type { MetaPlatform } from './categories';

/**
 * Mock Meta EYI sender (docs/connectors/meta-eyi.md §32). Simulates Meta pushing
 * a transfer to Bewora's importer so the whole Bewora side can be built and
 * tested before Meta approval. Deterministic: an item's bytes are derived from
 * its stable id, so re-sending the same item (recurring export) yields the same
 * SHA-256 and therefore deduplicates (§17).
 */
export interface MockTransferItem {
  endpoint: 'photos' | 'videos' | 'social-posts';
  meta: Record<string, unknown>;
  bytes?: Uint8Array;
}

export interface MockTransfer {
  transferId: string;
  platform: MetaPlatform;
  kind: 'INITIAL' | 'RECURRING';
  items: MockTransferItem[];
}

function bytesFor(id: string): Uint8Array {
  return new TextEncoder().encode(`mock-media::${id}`);
}

function photo(platform: MetaPlatform, i: number): MockTransferItem {
  const id = `${platform}-photo-${i}`;
  return {
    endpoint: 'photos',
    meta: {
      '@type': 'PhotoModel',
      payload: {
        dataId: id,
        name: `IMG_${String(i).padStart(4, '0')}.jpg`,
        mimeType: 'image/jpeg',
        creationTime: 1_600_000_000 + i * 3600,
        albumId: `${platform}-album-1`,
      },
    },
    bytes: bytesFor(id),
  };
}

function post(platform: MetaPlatform, i: number): MockTransferItem {
  const id = `${platform}-post-${i}`;
  return {
    endpoint: 'social-posts',
    meta: {
      '@type': 'SocialActivityModel',
      payload: {
        activity: {
          id,
          type: 'NOTE',
          content: `Bericht ${i}`,
          published: 1_600_000_000 + i * 7200,
        },
      },
    },
  };
}

/** An initial full-history export of `count` photos (+ a couple of posts). */
export function mockInitialTransfer(platform: MetaPlatform, count = 10): MockTransfer {
  const items: MockTransferItem[] = [];
  for (let i = 0; i < count; i++) items.push(photo(platform, i));
  items.push(post(platform, 0), post(platform, 1));
  return { transferId: `${platform}-initial`, platform, kind: 'INITIAL', items };
}

/** A recurring export: all previous items again (duplicates) plus `added` new. */
export function mockRecurringTransfer(
  platform: MetaPlatform,
  previousCount = 10,
  added = 10,
): MockTransfer {
  const items: MockTransferItem[] = [];
  for (let i = 0; i < previousCount + added; i++) items.push(photo(platform, i));
  return { transferId: `${platform}-recurring-1`, platform, kind: 'RECURRING', items };
}

/** A malformed item (missing metadata) — the importer must reject it safely. */
export function mockMalformedItem(): MockTransferItem {
  return {
    endpoint: 'photos',
    meta: { '@type': 'PhotoModel', payload: {} },
    bytes: new Uint8Array(),
  };
}
