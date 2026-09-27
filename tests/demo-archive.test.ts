import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { demoPhotos, demoMemories, getPhoto } from '../apps/web/lib/demo/data';
import {
  filterPhotos,
  sortPhotos,
  queryPhotos,
  photoSourceCards,
  placeBuckets,
  peopleCards,
  userAlbumCards,
  smartAlbumById,
  buildTimeline,
  sourcesForDetail,
  NO_LOCATION,
} from '../apps/web/lib/demo/queries';
import {
  queryDocuments,
  sortDocuments,
  folderTreeForSource,
  documentSourceCards,
  type FolderNode,
} from '../apps/web/lib/demo/documents';
import { formatDemoDate, yearOf } from '../apps/web/lib/demo/dates';
import { build } from '../scripts/demo/build-demo-data.mjs';

const p = (n: number) => `demo-photo-${String(n).padStart(3, '0')}`;

describe('demo photo filtering (§30)', () => {
  it('filters by source (origin)', () => {
    const wa = filterPhotos(demoPhotos, { source: 'whatsapp' });
    expect(wa.length).toBeGreaterThan(0);
    expect(wa.every((x) => x.originSource === 'whatsapp')).toBe(true);
  });

  it('filters by year', () => {
    const y = queryPhotos({ year: 2025 });
    expect(y.every((x) => yearOf(x.capturedAt) === 2025)).toBe(true);
  });

  it('combines facets (WhatsApp + 2025)', () => {
    const r = queryPhotos({ source: 'whatsapp', year: 2025 });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => x.originSource === 'whatsapp' && yearOf(x.capturedAt) === 2025)).toBe(
      true,
    );
  });

  it('combines facets (Instagram + Madeira) includes the Funchal dinner', () => {
    const r = queryPhotos({ source: 'instagram', place: 'Madeira' });
    expect(r.map((x) => x.id)).toContain(p(9));
  });
});

describe('source cards (§24)', () => {
  it('counts sum to the visible library and are by origin', () => {
    const cards = photoSourceCards();
    expect(cards.reduce((s, c) => s + c.count, 0)).toBe(demoPhotos.length);
    // WhatsApp appears as a primary origin on several photos.
    expect(cards.find((c) => c.key === 'whatsapp')?.count).toBeGreaterThanOrEqual(5);
  });
});

describe('albums & smart albums (§27, §11)', () => {
  it('Madeira 2026 album has the five Madeira photos', () => {
    const madeira = userAlbumCards().find((a) => a.title === 'Madeira 2026');
    expect(madeira?.count).toBeGreaterThanOrEqual(5);
  });
  it('smart album Favorieten only contains favourites', () => {
    const fav = smartAlbumById('smart-favorieten');
    expect(fav && fav.items.length).toBeGreaterThan(0);
    expect(fav?.items.every((x) => x.favorite)).toBe(true);
  });
  it("smart album Oude familiefoto's is everything before 1990", () => {
    const old = smartAlbumById('smart-oude-familiefotos');
    expect(old?.items.map((x) => x.id)).toEqual(expect.arrayContaining([p(16), p(17), p(18)]));
    expect(old?.items.every((x) => yearOf(x.capturedAt) < 1990)).toBe(true);
  });
});

describe('people (§28)', () => {
  it('derives relationships from photos', () => {
    const cards = peopleCards();
    expect(cards.find((c) => c.name === 'Vader')?.count).toBeGreaterThan(0);
    expect(cards.find((c) => c.name === 'Collega 1')?.count).toBeGreaterThanOrEqual(1);
  });
});

describe('places (§25, §26, §64)', () => {
  it('Madeira bucket has five photos mixing Apple and Instagram', () => {
    const madeira = placeBuckets().find((b) => b.name === 'Madeira');
    expect(madeira?.count).toBeGreaterThanOrEqual(5);
    expect(madeira?.sources).toEqual(expect.arrayContaining(["Apple Foto's", 'Instagram']));
  });
  it('photos without coordinates land under Zonder locatie', () => {
    const none = placeBuckets().find((b) => b.name === NO_LOCATION);
    expect(none?.count).toBeGreaterThan(0);
    expect(none?.centroid).toBeNull();
  });
});

describe('timeline (§23, §59)', () => {
  it('groups by year descending and includes the old scans', () => {
    const tl = buildTimeline();
    const years = tl.map((y) => y.year);
    expect(years).toEqual([...years].sort((a, b) => b - a));
    for (const y of [1964, 1978, 1985, 2019, 2024, 2025, 2026]) expect(years).toContain(y);
  });
  it('total items across timeline equals the library', () => {
    const total = buildTimeline().reduce((s, y) => s + y.count, 0);
    expect(total).toBe(demoPhotos.length);
  });
});

describe('date precision (§19, §63)', () => {
  it('renders a 1978 scan as the year only', () => {
    expect(formatDemoDate('1978-01-01', 'YEAR')).toBe('1978');
    expect(formatDemoDate('1978-01-01', 'YEAR')).not.toContain('januari');
  });
  it('renders exact time with the clock', () => {
    expect(formatDemoDate('2026-08-14T19:42:00+02:00', 'EXACT_TIME')).toContain('19:42');
  });
});

describe('provenance & versions (§7, §8, §49, §62)', () => {
  it('a duplicate appears once but lists two sources', () => {
    expect(demoPhotos.filter((x) => x.id === p(1))).toHaveLength(1);
    const prov = sourcesForDetail(getPhoto(p(1))!);
    expect(prov.count).toBe(2);
  });
  it('a source deletion is tombstoned while the item stays visible', () => {
    const photo = getPhoto(p(19))!;
    const prov = sourcesForDetail(photo);
    expect(prov.deleted.length).toBe(1);
    expect(queryPhotos().map((x) => x.id)).toContain(p(19));
  });
  it('a user override is preserved on the item', () => {
    const photo = getPhoto(p(6))!;
    expect(photo.providerPlace).toBe('Calheta');
    expect(photo.place).toBe('Tennisclub Calheta');
  });
});

describe('documents (§32, §34, §35)', () => {
  it('sorts by name A–Z', () => {
    const sorted = sortDocuments(queryDocuments(), 'name_asc');
    const titles = sorted.map((d) => d.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'nl')));
  });
  it('filters by source', () => {
    const gd = queryDocuments({ source: 'google_drive' });
    expect(gd.length).toBeGreaterThan(0);
    expect(gd.every((d) => d.source === 'google_drive')).toBe(true);
  });
  it('has every document source', () => {
    const keys = documentSourceCards().map((c) => c.key);
    expect(keys).toEqual(
      expect.arrayContaining(['google_drive', 'onedrive', 'dropbox', 'manual_upload']),
    );
  });
  it('folder hierarchy contains Google Drive → Privé → Huis → Hypotheek with documents', () => {
    const root = folderTreeForSource('google_drive');
    const find = (node: FolderNode | null, path: string): FolderNode | null => {
      if (!node) return null;
      if (node.path === path) return node;
      for (const c of node.children) {
        const hit = find(c, path);
        if (hit) return hit;
      }
      return null;
    };
    const hypotheek = find(root, 'Mijn Drive/Privé/Huis/Hypotheek');
    expect(hypotheek?.count).toBeGreaterThanOrEqual(2);
  });
});

describe('memories / my life (§38, §66)', () => {
  it('Nieuwe woning links the right photos and three documents', () => {
    const m = demoMemories.find((x) => x.title === 'Nieuwe woning')!;
    expect(m.photoIds).toEqual(expect.arrayContaining([p(19), p(20), p(30)]));
    expect(m.documentIds).toHaveLength(3);
  });
  it('has an external Beeld & Geluid demo reference', () => {
    const ext = demoMemories.find((x) => x.externalReference);
    expect(ext?.externalReference?.provider).toBe('Beeld & Geluid');
    expect(ext?.externalReference?.status).toBe('DEMO');
  });
});

describe('seed idempotency (§41)', () => {
  it('produces byte-identical JSON when run twice', () => {
    const file = fileURLToPath(new URL('../data/demo/demo-photos.json', import.meta.url));
    build({ quiet: true });
    const first = readFileSync(file, 'utf8');
    build({ quiet: true });
    const second = readFileSync(file, 'utf8');
    expect(second).toBe(first);
  });
});

describe('sort stability', () => {
  it('captured_desc orders newest first', () => {
    const sorted = sortPhotos(demoPhotos, 'captured_desc');
    const times = sorted.map((x) => Date.parse(x.capturedAt) || 0);
    for (let i = 1; i < times.length; i++) expect(times[i - 1]!).toBeGreaterThanOrEqual(times[i]!);
  });
});
