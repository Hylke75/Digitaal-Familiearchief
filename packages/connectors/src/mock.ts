import type {
  ArchiveConnector,
  ChangeSet,
  ConnectorCapability,
  ConnectorStatus,
  DiscoveredItem,
} from './types';
import { getConnector } from './registry';

/**
 * MockArchiveConnector (CLAUDE.md §19) — simulates a real source with no
 * external dependency, so the entire archive engine can be tested end to end.
 * Produces a deterministic library: 100 photos, 20 videos, 30 documents, with
 * stable synthetic bytes so checksums (and therefore dedup) are reproducible.
 */
const COUNTS = { photo: 100, video: 20, document: 30 } as const;

interface MockOptions {
  /** Simulate expired authorization on the next status check. */
  authExpired?: boolean;
  /** Simulate a temporary provider outage (connection invalid). */
  outage?: boolean;
}

function isoFromIndex(index: number): string {
  // Spread items deterministically across 2018-01-01 .. 2026-01-01.
  const start = Date.UTC(2018, 0, 1);
  const end = Date.UTC(2026, 0, 1);
  const span = end - start;
  const total = COUNTS.photo + COUNTS.video + COUNTS.document;
  return new Date(start + Math.floor((span * index) / total)).toISOString();
}

function buildLibrary(): DiscoveredItem[] {
  const items: DiscoveredItem[] = [];
  let i = 0;
  const push = (kind: 'photo' | 'video' | 'document', n: number, mime: string, ext: string) => {
    for (let k = 0; k < n; k++) {
      const sourceItemId = `${kind}-${k}`;
      items.push({
        sourceItemId,
        filename: `${kind}_${String(k).padStart(3, '0')}.${ext}`,
        mimeType: mime,
        // Deterministic pseudo-size; content length matches this in fetchContent.
        sizeBytes: 1024 + ((k * 37 + kind.length) % 4096),
        createdAtSource: isoFromIndex(i),
        modifiedAtSource: isoFromIndex(i),
      });
      i++;
    }
  };
  push('photo', COUNTS.photo, 'image/jpeg', 'jpg');
  push('video', COUNTS.video, 'video/mp4', 'mp4');
  push('document', COUNTS.document, 'application/pdf', 'pdf');
  return items;
}

export class MockArchiveConnector implements ArchiveConnector {
  readonly capability: ConnectorCapability;
  private readonly items: DiscoveredItem[];

  constructor(private readonly options: MockOptions = {}) {
    const cap = getConnector('mock');
    if (!cap) throw new Error('mock connector missing from registry');
    this.capability = cap;
    this.items = buildLibrary();
  }

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async validateConnection(): Promise<boolean> {
    return !this.options.outage;
  }

  async discover(): Promise<DiscoveredItem[]> {
    if (this.options.outage) throw new Error('provider outage');
    return this.items;
  }

  async *initialImport(): AsyncIterable<DiscoveredItem> {
    for (const item of this.items) yield item;
  }

  async getChanges(): Promise<ChangeSet> {
    // A tiny incremental change set: one new item, one deleted source.
    const added: DiscoveredItem = {
      sourceItemId: 'photo-new-1',
      filename: 'photo_new_001.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2048,
      createdAtSource: new Date(Date.UTC(2026, 5, 1)).toISOString(),
    };
    return {
      added: [added],
      modified: [],
      deletedSourceItemIds: ['photo-0'],
      nextCursor: 'mock-1',
    };
  }

  async *importChanges(changes: ChangeSet): AsyncIterable<DiscoveredItem> {
    for (const item of changes.added) yield item;
  }

  /** Deterministic synthetic bytes for an item; stable per sourceItemId. */
  async fetchContent(item: DiscoveredItem): Promise<Uint8Array> {
    const seed = `mock-content:${item.sourceItemId}`;
    const out = new Uint8Array(item.sizeBytes);
    for (let j = 0; j < out.length; j++) {
      out[j] = (seed.charCodeAt(j % seed.length) + j) % 256;
    }
    return out;
  }

  async refreshAuthorization(): Promise<void> {
    this.options.authExpired = false;
  }

  async getStatus(): Promise<ConnectorStatus> {
    if (this.options.authExpired) {
      return {
        status: 'action_required',
        safeMessage: 'Deze bron heeft opnieuw je toestemming nodig.',
      };
    }
    if (this.options.outage) {
      return { status: 'temporary_problem', safeMessage: 'We proberen het later opnieuw.' };
    }
    return { status: 'connected' };
  }
}
