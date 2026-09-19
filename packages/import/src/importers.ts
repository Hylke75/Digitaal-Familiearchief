import type { ArchiveImporter, ImportResultSet, ImportedItem } from './types';
import { filenameOf, isMediaName, mimeFromName } from './mime';

/** Shared media extraction: emit an ImportedItem for every safe media file. */
function extractMedia(
  files: Map<string, Uint8Array>,
  provider: string,
  opts: { includeDocuments?: boolean } = {},
): ImportResultSet {
  const items: ImportedItem[] = [];
  const warnings: string[] = [];
  for (const [path, bytes] of files) {
    const media = isMediaName(path);
    const mime = mimeFromName(path);
    const isDoc =
      mime === 'application/pdf' || mime.startsWith('application/') || mime === 'text/plain';
    if (media || (opts.includeDocuments && isDoc)) {
      items.push({
        sourceItemId: path,
        path,
        filename: filenameOf(path),
        mimeType: mime,
        bytes,
        metadata: { provider, path },
      });
    }
  }
  if (items.length === 0) warnings.push('Geen media of documenten gevonden in het archief.');
  return { items, warnings };
}

const has = (names: string[], needle: string) =>
  names.some((n) => n.toLowerCase().includes(needle));

export const InstagramImporter: ArchiveImporter = {
  key: 'instagram',
  displayName: 'Instagram',
  detect(names) {
    if (has(names, 'your_instagram_activity') || has(names, 'media/posts')) return 0.95;
    if (has(names, 'instagram')) return 0.6;
    return 0;
  },
  parse: (files) => extractMedia(files, 'instagram'),
};

export const FacebookImporter: ArchiveImporter = {
  key: 'facebook',
  displayName: 'Facebook',
  detect(names) {
    if (has(names, 'your_facebook_activity') || has(names, 'facebook/posts')) return 0.95;
    if (has(names, 'facebook')) return 0.6;
    return 0;
  },
  parse: (files) => extractMedia(files, 'facebook'),
};

export const SnapchatImporter: ArchiveImporter = {
  key: 'snapchat',
  displayName: 'Snapchat',
  detect(names) {
    if (has(names, 'memories_history') || has(names, 'memories/')) return 0.95;
    if (has(names, 'snapchat')) return 0.6;
    return 0;
  },
  parse: (files) => extractMedia(files, 'snapchat'),
};

export const XImporter: ArchiveImporter = {
  key: 'x',
  displayName: 'X',
  detect(names) {
    if (has(names, 'data/tweets') || has(names, 'tweets.js') || has(names, 'tweet.js')) return 0.95;
    if (has(names, 'manifest.js') && has(names, 'data/')) return 0.7;
    if (has(names, 'twitter')) return 0.5;
    return 0;
  },
  parse: (files) => extractMedia(files, 'x'),
};

export const GoogleTakeoutImporter: ArchiveImporter = {
  key: 'google_takeout',
  displayName: 'Google Takeout',
  detect(names) {
    if (names.some((n) => /(^|\/)takeout\//i.test(n))) return 0.9;
    return 0;
  },
  parse: (files) => extractMedia(files, 'google_takeout', { includeDocuments: true }),
};

export const GenericZipImporter: ArchiveImporter = {
  key: 'generic',
  displayName: 'Archiefbestand',
  detect: () => 0.1, // always a low-confidence fallback
  parse: (files) => extractMedia(files, 'generic', { includeDocuments: true }),
};

export const IMPORTERS: readonly ArchiveImporter[] = [
  InstagramImporter,
  FacebookImporter,
  SnapchatImporter,
  XImporter,
  GoogleTakeoutImporter,
  GenericZipImporter,
];
