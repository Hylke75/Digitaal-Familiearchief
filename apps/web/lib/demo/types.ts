// Types for the file-backed demo dataset (generated into /data/demo by
// scripts/demo/build-demo-data.mjs). These mirror the JSON shape 1:1.

export type DatePrecision = 'EXACT_TIME' | 'DATE' | 'MONTH' | 'YEAR' | 'APPROXIMATE' | 'UNKNOWN';
export type LocationSource = 'EXIF' | 'PROVIDER' | 'USER' | 'INFERRED' | 'UNKNOWN';

export interface DemoSourceRel {
  key: string;
  label: string;
  primary: boolean;
  /** When the provider copy disappeared. Archive copy stays visible (§4, §49). */
  sourceDeletedAt: string | null;
}

export interface DemoVersion {
  id: string;
  filename: string;
  label: string;
  note: string | null;
  sourceKey: string;
  sourceLabel: string;
  relationship: string;
}

export interface DemoPhoto {
  id: string;
  type: 'photo';
  n: number;
  filename: string;
  title: string;
  originSource: string;
  sources: DemoSourceRel[];
  versions: DemoVersion[];
  capturedAt: string;
  datePrecision: DatePrecision;
  place: string | null;
  providerPlace: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  locationSource: LocationSource;
  region: string | null;
  albums: string[];
  people: string[];
  tags: string[];
  favorite: boolean;
  width: number;
  height: number;
  hasUserOverride: boolean;
  is_demo: true;
}

export interface DemoPerson {
  id: string;
  name: string;
  role: string;
  color: string;
  is_demo: true;
}

export interface DemoAlbum {
  id: string;
  title: string;
  type: 'user';
  is_demo: true;
}

export interface SmartAlbumRule {
  source?: string;
  year?: number;
  placeContains?: string;
  favorite?: boolean;
  beforeYear?: number;
}

export interface DemoSmartAlbum {
  id: string;
  title: string;
  rule: SmartAlbumRule;
  type: 'smart';
  is_demo: true;
}

export interface DemoDocument {
  id: string;
  type: 'document';
  title: string;
  filename: string;
  placeholder: string;
  category: string;
  source: string;
  sourceLabel: string;
  folder: string | null;
  documentDate: string;
  modifiedAt: string;
  mimeType: string;
  fileSize: number;
  tags: string[];
  is_demo: true;
}

export interface ExternalReference {
  provider: string;
  programme: string;
  date: string;
  fragmentStart: string;
  fragmentEnd: string;
  status: string;
}

export interface DemoMemory {
  id: string;
  title: string;
  date: string;
  datePrecision: DatePrecision;
  place: string | null;
  story: string;
  photoIds: string[];
  documentIds: string[];
  externalReference: ExternalReference | null;
  is_demo: true;
}

export type FolderTree = { [name: string]: FolderTree };
export interface DemoSourceFolders {
  label: string;
  root: string;
  tree: FolderTree;
}
export type DemoFolders = Record<string, DemoSourceFolders>;

export interface LatLng {
  lat: number;
  lng: number;
}
