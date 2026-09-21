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

/** WhatsApp media filenames carry a reliable, locale-independent date, e.g.
 * `IMG-20240115-WA0001.jpg` / `VID-20240115-WA0002.mp4`. */
function whatsappDate(name: string): string | undefined {
  const m = name.match(/(?:IMG|VID|AUD|PTT|STK)-(\d{4})(\d{2})(\d{2})-WA\d+/i);
  return m ? `${m[1]}-${m[2]}-${m[3]}T12:00:00.000Z` : undefined;
}

export const WhatsAppImporter: ArchiveImporter = {
  key: 'whatsapp',
  displayName: 'WhatsApp',
  detect(names) {
    // A WhatsApp "Export chat" package: a _chat.txt transcript + media files.
    if (has(names, '_chat.txt')) return 0.96;
    if (names.some((n) => /-WA\d{3,}\./i.test(n))) return 0.85;
    if (has(names, 'whatsapp')) return 0.5;
    return 0;
  },
  parse(files) {
    const items: ImportedItem[] = [];
    const warnings: string[] = [];
    for (const [path, bytes] of files) {
      if (!isMediaName(path)) continue;
      const filename = filenameOf(path);
      items.push({
        sourceItemId: path,
        path,
        filename,
        mimeType: mimeFromName(path),
        bytes,
        createdAtSource: whatsappDate(filename),
        // A WhatsApp export is authoritative provenance (§8, §30). View Once is
        // never present in exports and is not archivable (§28).
        metadata: {
          provider: 'whatsapp',
          origin_source: 'whatsapp',
          origin_confidence: 'verified',
        },
      });
    }
    if (items.length === 0) warnings.push('Geen WhatsApp-media gevonden in de export.');
    return { items, warnings };
  },
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
  WhatsAppImporter,
  GoogleTakeoutImporter,
  GenericZipImporter,
];
