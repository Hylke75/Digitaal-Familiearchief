// Loads the generated demo JSON (single source of truth in /data/demo). Static
// imports are inlined at build time, so this works in dev and on Vercel without
// any runtime filesystem access. The demo experience reads ONLY this data.

import photosJson from '../../../../data/demo/demo-photos.json';
import peopleJson from '../../../../data/demo/demo-people.json';
import albumsJson from '../../../../data/demo/demo-albums.json';
import documentsJson from '../../../../data/demo/demo-documents.json';
import memoriesJson from '../../../../data/demo/demo-memories.json';
import foldersJson from '../../../../data/demo/demo-folders.json';
import placesJson from '../../../../data/demo/demo-places.json';
import type {
  DemoAlbum,
  DemoDocument,
  DemoFolders,
  DemoMemory,
  DemoPerson,
  DemoPhoto,
  DemoSmartAlbum,
  LatLng,
} from './types';

export const demoPhotos = photosJson.photos as unknown as DemoPhoto[];
export const demoPeople = peopleJson.people as unknown as DemoPerson[];
export const demoAlbums = albumsJson.albums as unknown as DemoAlbum[];
export const demoSmartAlbums = albumsJson.smartAlbums as unknown as DemoSmartAlbum[];
export const demoDocuments = documentsJson.documents as unknown as DemoDocument[];
export const demoDocumentCategories = documentsJson.categories as string[];
export const demoMemories = memoriesJson.memories as unknown as DemoMemory[];
export const demoFolders = foldersJson.folders as unknown as DemoFolders;
export const regionCentroids = placesJson.centroids as Record<string, LatLng>;

// Indexes ------------------------------------------------------------------
const photoById = new Map(demoPhotos.map((p) => [p.id, p]));
const documentById = new Map(demoDocuments.map((d) => [d.id, d]));
const personByName = new Map(demoPeople.map((p) => [p.name, p]));

export function getPhoto(id: string): DemoPhoto | undefined {
  return photoById.get(id);
}
export function getDocument(id: string): DemoDocument | undefined {
  return documentById.get(id);
}
export function getPerson(idOrName: string): DemoPerson | undefined {
  return personByName.get(idOrName) ?? demoPeople.find((p) => p.id === idOrName);
}
export function getPhotosByIds(ids: string[]): DemoPhoto[] {
  return ids.map((id) => photoById.get(id)).filter((p): p is DemoPhoto => Boolean(p));
}
export function getDocumentsByIds(ids: string[]): DemoDocument[] {
  return ids.map((id) => documentById.get(id)).filter((d): d is DemoDocument => Boolean(d));
}
