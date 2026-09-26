import { describe, expect, it } from 'vitest';
import {
  breadcrumbs,
  decodePath,
  encodePath,
  folderView,
  parseFolderSegments,
} from '../apps/web/lib/archive/document-tree';

describe('parseFolderSegments', () => {
  it('prefers a structured map field', () => {
    expect(parseFolderSegments({ map: 'Mijn Drive/Privé/Belastingen' })).toEqual([
      'Mijn Drive',
      'Privé',
      'Belastingen',
    ]);
  });

  it('falls back to parsing "Map: …" from the document text', () => {
    const text =
      'DEMO DOCUMENT x.pdf Categorie: Belasting Bron: Google Drive Map: Mijn Drive/Prive/Belastingen Documentdatum: 2026-04-30 Dit document…';
    expect(parseFolderSegments({ text })).toEqual(['Mijn Drive', 'Prive', 'Belastingen']);
  });

  it('keeps spaces inside a segment', () => {
    expect(parseFolderSegments({ map: 'Handmatig toegevoegd' })).toEqual(['Handmatig toegevoegd']);
  });

  it('returns an empty path when nothing is known', () => {
    expect(parseFolderSegments({})).toEqual([]);
    expect(parseFolderSegments(null)).toEqual([]);
  });
});

describe('folderView', () => {
  const docs = [
    { id: 'a', folderPath: ['Mijn Drive', 'Privé', 'Belastingen'] },
    { id: 'b', folderPath: ['Mijn Drive', 'Privé', 'Huis'] },
    { id: 'c', folderPath: ['Mijn Drive', 'Privé', 'Huis'] },
    { id: 'd', folderPath: ['Documenten'] },
    { id: 'e', folderPath: [] }, // los in de wortel
  ];

  it('at the root lists top folders with recursive counts and loose files', () => {
    const v = folderView(docs, []);
    expect(v.folders).toEqual([
      { name: 'Documenten', path: ['Documenten'], count: 1 },
      { name: 'Mijn Drive', path: ['Mijn Drive'], count: 3 },
    ]);
    expect(v.files.map((f) => f.id)).toEqual(['e']);
  });

  it('descends into a subfolder', () => {
    const v = folderView(docs, ['Mijn Drive', 'Privé']);
    expect(v.folders.map((f) => f.name)).toEqual(['Belastingen', 'Huis']);
    expect(v.folders.find((f) => f.name === 'Huis')?.count).toBe(2);
    expect(v.files).toEqual([]);
  });

  it('lists files that sit directly in the folder', () => {
    const v = folderView(docs, ['Mijn Drive', 'Privé', 'Huis']);
    expect(v.folders).toEqual([]);
    expect(v.files.map((f) => f.id)).toEqual(['b', 'c']);
  });
});

describe('path (de)serialisation + breadcrumbs', () => {
  it('round-trips a path through the query value', () => {
    const path = ['Mijn Drive', 'Privé'];
    expect(decodePath(encodePath(path))).toEqual(path);
  });

  it('builds cumulative breadcrumbs', () => {
    expect(breadcrumbs(['A', 'B', 'C'])).toEqual([
      { name: 'A', path: ['A'] },
      { name: 'B', path: ['A', 'B'] },
      { name: 'C', path: ['A', 'B', 'C'] },
    ]);
  });
});
