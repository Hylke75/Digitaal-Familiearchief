// Document query engine (§32–§36). Documents are a document-oriented library,
// not a photo gallery. Categories (Bewora classification) and source folders
// (provider structure) are separate concepts that coexist (§13, §35).

import { demoDocuments, demoDocumentCategories, demoFolders } from './data';
import { yearOf } from './dates';
import type { DemoDocument, FolderTree } from './types';

export const DOC_SOURCE_ORDER = ['google_drive', 'onedrive', 'dropbox', 'manual_upload'] as const;
export const DOC_SOURCE_LABELS: Record<string, string> = {
  google_drive: 'Google Drive',
  onedrive: 'OneDrive',
  dropbox: 'Dropbox',
  manual_upload: 'Handmatig toegevoegd',
};

export type DocSort =
  | 'date_desc'
  | 'date_asc'
  | 'modified_desc'
  | 'name_asc'
  | 'name_desc'
  | 'added_desc'
  | 'added_asc';
export const DEFAULT_DOC_SORT: DocSort = 'date_desc';

export interface DocFilter {
  category?: string;
  source?: string;
  year?: number;
  folder?: string; // path prefix (selecting a parent shows nested docs)
  query?: string;
}

export function filterDocuments(docs: DemoDocument[], f: DocFilter): DemoDocument[] {
  const q = f.query?.trim().toLowerCase();
  return docs.filter((d) => {
    if (f.category && d.category !== f.category) return false;
    if (f.source && d.source !== f.source) return false;
    if (f.year != null && yearOf(d.documentDate) !== f.year) return false;
    if (f.folder) {
      if (!d.folder) return false;
      if (d.folder !== f.folder && !d.folder.startsWith(f.folder + '/')) return false;
    }
    if (q) {
      const hay = [d.title, d.category, d.sourceLabel, d.folder, ...d.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortDocuments(docs: DemoDocument[], sort: DocSort): DemoDocument[] {
  const arr = [...docs];
  const idx = new Map(demoDocuments.map((d, i) => [d.id, i]));
  switch (sort) {
    case 'date_asc':
      return arr.sort((a, b) => a.documentDate.localeCompare(b.documentDate));
    case 'modified_desc':
      return arr.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
    case 'name_asc':
      return arr.sort((a, b) => a.title.localeCompare(b.title, 'nl'));
    case 'name_desc':
      return arr.sort((a, b) => b.title.localeCompare(a.title, 'nl'));
    case 'added_desc':
      return arr.sort((a, b) => (idx.get(b.id) ?? 0) - (idx.get(a.id) ?? 0));
    case 'added_asc':
      return arr.sort((a, b) => (idx.get(a.id) ?? 0) - (idx.get(b.id) ?? 0));
    case 'date_desc':
    default:
      return arr.sort((a, b) => b.documentDate.localeCompare(a.documentDate));
  }
}

export function queryDocuments(
  f: DocFilter = {},
  sort: DocSort = DEFAULT_DOC_SORT,
): DemoDocument[] {
  return sortDocuments(filterDocuments(demoDocuments, f), sort);
}

export interface DocCategoryCard {
  name: string;
  count: number;
}
export function categoryCards(): DocCategoryCard[] {
  return demoDocumentCategories.map((name) => ({
    name,
    count: demoDocuments.filter((d) => d.category === name).length,
  }));
}

export interface DocSourceCard {
  key: string;
  label: string;
  count: number;
}
export function documentSourceCards(): DocSourceCard[] {
  return DOC_SOURCE_ORDER.map((key) => ({
    key,
    label: DOC_SOURCE_LABELS[key] ?? key,
    count: demoDocuments.filter((d) => d.source === key).length,
  })).filter((c) => c.count > 0);
}

export function availableDocYears(): number[] {
  return [...new Set(demoDocuments.map((d) => yearOf(d.documentDate)))].sort((a, b) => b - a);
}

// --- source folder trees (§35) ---------------------------------------------
export interface FolderNode {
  name: string;
  path: string;
  count: number; // documents in this folder + descendants
  children: FolderNode[];
}

function buildNode(name: string, path: string, subtree: FolderTree, source: string): FolderNode {
  const children = Object.entries(subtree).map(([childName, childTree]) =>
    buildNode(childName, `${path}/${childName}`, childTree, source),
  );
  const directCount = demoDocuments.filter((d) => d.source === source && d.folder === path).length;
  const childCount = children.reduce((sum, c) => sum + c.count, 0);
  return { name, path, count: directCount + childCount, children };
}

export function folderTreeForSource(source: string): FolderNode | null {
  const def = demoFolders[source];
  if (!def) return null;
  const rootTree = def.tree[def.root] ?? {};
  return buildNode(def.root, def.root, rootTree, source);
}

export function foldersSourceList(): { key: string; label: string }[] {
  return Object.keys(demoFolders).map((key) => ({ key, label: demoFolders[key]?.label ?? key }));
}
