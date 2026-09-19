/** One item extracted from an uploaded archive, ready for the archive engine. */
export interface ImportedItem {
  /** Stable id within the source archive (its path). */
  sourceItemId: string;
  path: string;
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
  createdAtSource?: string;
  metadata?: Record<string, unknown>;
}

export interface ImportResultSet {
  items: ImportedItem[];
  warnings: string[];
}

/**
 * Provider archive importer (CONNECTORS_BUILD.md §25). Version-tolerant:
 * detection uses known signature files; parsing skips unknown files rather than
 * failing the whole import.
 */
export interface ArchiveImporter {
  key: string;
  displayName: string;
  /** Confidence in [0,1] that this archive belongs to this provider. */
  detect(entryNames: string[]): number;
  parse(files: Map<string, Uint8Array>): ImportResultSet;
}

export interface DetectionResult {
  importerKey: string;
  displayName: string;
  confidence: number;
}
