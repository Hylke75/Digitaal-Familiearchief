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
    { id: 'a', folderPath: ['Mijn Drive', 'Privé', 'Belastingen'], source: 'Google Drive' },
    { id: 'b', folderPath: ['Mijn Drive', 'Privé', 'Huis'], source: 'Google Drive' },
    { id: 'c', folderPath: ['Mijn Drive', 'Privé', 'Huis'], source: 'OneDrive' },
    { id: 'd', folderPath: ['Documenten'], source: 'Dropbox' },
    { id: 'e', folderPath: [], source: null }, // los in de wortel
  ];

  it('at the root sorts folders by count (desc), with recursive counts and loose files', () => {
    const v = folderView(docs, []);
    expect(v.folders.map((f) => [f.name, f.count])).toEqual([
      ['Mijn Drive', 3],
      ['Documenten', 1],
    ]);
    expect(v.files.map((f) => f.id)).toEqual(['e']);
  });

  it('descends into a subfolder (bigger folder first)', () => {
    const v = folderView(docs, ['Mijn Drive', 'Privé']);
    expect(v.folders.map((f) => f.name)).toEqual(['Huis', 'Belastingen']);
    expect(v.folders.find((f) => f.name === 'Huis')?.count).toBe(2);
    expect(v.files).toEqual([]);
  });

  it('reports the dominant source per folder', () => {
    const v = folderView(docs, []);
    // Mijn Drive: 2× Google Drive vs 1× OneDrive → Google Drive wint.
    expect(v.folders.find((f) => f.name === 'Mijn Drive')?.source).toBe('Google Drive');
    expect(v.folders.find((f) => f.name === 'Documenten')?.source).toBe('Dropbox');
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
