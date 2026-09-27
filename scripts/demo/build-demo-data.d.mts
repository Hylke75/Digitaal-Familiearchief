// Types for the file-backed demo seed generator (build-demo-data.mjs), so it can
// be imported from TypeScript tests without an implicit-any error.
export interface DemoSeedReport {
  photos: number;
  people: number;
  albums: number;
  smartAlbums: number;
  documents: number;
  memories: number;
  sourcesPhoto: Record<string, number>;
  sourcesDocument: Record<string, number>;
  categories: Record<string, number>;
  placeholders: { missingRealPhotos: string[]; documentPlaceholders: number };
}

export function build(opts?: { quiet?: boolean }): DemoSeedReport;
