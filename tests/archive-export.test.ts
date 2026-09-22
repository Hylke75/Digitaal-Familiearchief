import { describe, expect, it } from 'vitest';
import {
  buildManifest,
  exportEntryName,
  extForMime,
  safeBase,
  type ExportItem,
} from '../apps/web/lib/archive/export-utils';

const item = (over: Partial<ExportItem> = {}): ExportItem => ({
  id: 'i1',
  original_filename: 'Gezin op het strand',
  type: 'photo',
  mime_type: 'image/jpeg',
  file_size: 1234,
  checksum_sha256: 'deadbeef',
  taken_at: '2024-08-14T19:42:00Z',
  created_at_source: null,
  archived_at: '2026-09-22T10:00:00Z',
  latitude: 52.1,
  longitude: 4.27,
  width: 4032,
  height: 3024,
  camera: 'iPhone 15',
  ...over,
});

describe('archive export helpers', () => {
  it('maps mime to a sensible extension', () => {
    expect(extForMime('image/jpeg')).toBe('jpg');
    expect(extForMime('application/pdf')).toBe('pdf');
    expect(extForMime('application/x-weird')).toBe('bin');
  });

  it('sanitises unsafe names and never returns empty', () => {
    expect(safeBase('a/b:c*?.jpg')).toBe('a bc.jpg');
    expect(safeBase('   ')).toBe('bestand');
    expect(safeBase('Reis/Italië')).toBe('Reis Italië');
  });

  it('builds a collision-free, foldered entry name without doubled extension', () => {
    expect(exportEntryName(item(), 0)).toBe('originals/photos/0001_Gezin op het strand.jpg');
    expect(exportEntryName(item({ original_filename: 'foo.jpg' }), 4)).toBe(
      'originals/photos/0005_foo.jpg',
    );
    expect(exportEntryName(item({ type: 'document', mime_type: 'application/pdf' }), 1)).toBe(
      'originals/documents/0002_Gezin op het strand.pdf',
    );
  });

  it('builds a portable manifest with location/dimensions', () => {
    const m = buildManifest([item()], '2026-09-22T12:00:00Z', false);
    expect(m.archive).toBe('Bewora');
    expect(m.itemCount).toBe(1);
    expect(m.items[0]!.file).toBe('originals/photos/0001_Gezin op het strand.jpg');
    expect(m.items[0]!.location).toEqual({ latitude: 52.1, longitude: 4.27 });
    expect(m.items[0]!.dimensions).toEqual({ width: 4032, height: 3024 });
    expect(buildManifest([item({ latitude: null })], 'x', true).items[0]!.location).toBeNull();
  });
});
