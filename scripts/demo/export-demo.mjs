#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Export the full demo library (90 photos + 24 documents + metadata) into one
// folder on the user's computer so they can seed/upload it themselves.
//
//   node scripts/demo/export-demo.mjs [targetDir]
//   default targetDir: ~/Desktop/bewora-demo-export
// ---------------------------------------------------------------------------
import { readFileSync, mkdirSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const target = process.argv[2] || join(homedir(), 'Desktop', 'bewora-demo-export');

const photosSrc = join(repoRoot, 'apps/web/public/demo/photos');
const docsSrc = join(repoRoot, 'apps/web/public/demo/documents');
const dataDir = join(repoRoot, 'data/demo');

const photos = JSON.parse(readFileSync(join(dataDir, 'demo-photos.json'), 'utf8')).photos;
const documents = JSON.parse(readFileSync(join(dataDir, 'demo-documents.json'), 'utf8')).documents;

const photosOut = join(target, 'fotos');
const docsOut = join(target, 'documenten');
const metaOut = join(target, 'metadata-json');
for (const d of [target, photosOut, docsOut, metaOut]) mkdirSync(d, { recursive: true });

// --- copy media -------------------------------------------------------------
let copiedPhotos = 0;
for (const p of photos) {
  const src = join(photosSrc, p.filename);
  if (existsSync(src)) {
    copyFileSync(src, join(photosOut, p.filename));
    copiedPhotos++;
  }
}
let copiedDocs = 0;
for (const d of documents) {
  const src = join(docsSrc, d.placeholder);
  if (existsSync(src)) {
    copyFileSync(src, join(docsOut, d.placeholder));
    copiedDocs++;
  }
}

// --- copy the raw metadata JSON too -----------------------------------------
for (const f of [
  'demo-photos.json',
  'demo-documents.json',
  'demo-people.json',
  'demo-albums.json',
  'demo-places.json',
  'demo-memories.json',
  'demo-folders.json',
]) {
  const src = join(dataDir, f);
  if (existsSync(src)) copyFileSync(src, join(metaOut, f));
}

// --- CSV helpers ------------------------------------------------------------
const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csvRow = (cells) => cells.map(csvCell).join(',');
const list = (arr) => (arr && arr.length ? arr.join('; ') : '');

// --- photos.csv -------------------------------------------------------------
const photoHeader = [
  'bestandsnaam', 'titel', 'gemaakt_op', 'datum_precisie', 'primaire_bron', 'alle_bronnen',
  'bron_verwijderd', 'favoriet', 'plaats', 'stad', 'land', 'lat', 'lng', 'regio',
  'locatiebron', 'albums', 'personen', 'labels', 'breedte', 'hoogte',
];
const photoRows = photos.map((p) =>
  csvRow([
    p.filename,
    p.title,
    p.capturedAt,
    p.datePrecision,
    p.sources.find((s) => s.primary)?.label ?? '',
    list(p.sources.map((s) => s.label)),
    list(p.sources.filter((s) => s.sourceDeletedAt).map((s) => s.label)),
    p.favorite ? 'ja' : '',
    p.place ?? '',
    p.city ?? '',
    p.country ?? '',
    p.lat ?? '',
    p.lng ?? '',
    p.region ?? '',
    p.locationSource,
    list(p.albums),
    list(p.people),
    list(p.tags),
    p.width,
    p.height,
  ]),
);
writeFileSync(join(target, 'foto-metadata.csv'), [csvRow(photoHeader), ...photoRows].join('\n') + '\n', 'utf8');

// --- documents.csv ----------------------------------------------------------
const docHeader = ['bestandsnaam', 'titel', 'categorie', 'bron', 'oorspronkelijke_map', 'documentdatum', 'gewijzigd_op', 'labels'];
const docRows = documents.map((d) =>
  csvRow([d.placeholder, d.title, d.category, d.sourceLabel, d.folder ?? '', d.documentDate, d.modifiedAt, list(d.tags)]),
);
writeFileSync(join(target, 'document-metadata.csv'), [csvRow(docHeader), ...docRows].join('\n') + '\n', 'utf8');

// --- README -----------------------------------------------------------------
const readme = `Bewora demo-export
==================

Deze map bevat de volledige demo-inhoud zodat je hem zelf kunt seeden/uploaden.

Inhoud:
  fotos/                 ${copiedPhotos} foto's (JPEG, exacte bestandsnamen)
  documenten/            ${copiedDocs} documenten (PDF, fictieve demogegevens)
  foto-metadata.csv      1 rij per foto: titel, datum, bron(nen), plaats, GPS,
                         albums, personen, labels, favoriet, afmetingen
  document-metadata.csv  1 rij per document: titel, categorie, bron, map, datum
  metadata-json/         de complete brondata (JSON) incl. personen, albums,
                         plaatsen (met GPS-centroids), herinneringen en mappen

Belangrijk over bronnen (herkomst):
  In "alle_bronnen" staat soms meer dan één bron. Dat betekent: dezelfde foto is
  in meerdere bronnen gevonden — het is ÉÉN archiefitem met meerdere herkomsten
  (niet dupliceren). "bron_verwijderd" markeert een bron waarvan de kopie is
  verdwenen; de archiefkopie blijft bestaan.

Datumprecisie:
  YEAR = alleen het jaar is bekend (bijv. oude scans) — toon dan alleen het jaar,
  niet 1 januari. MONTH/DATE/EXACT_TIME spreken voor zich.

Zelf seeden naar bewora.nl (aanrader):
  1. Zet SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local
  2. pnpm seed:demo:live
  Dit uploadt alles naar de demo-gebruiker (demo@bewora.nl) en zet albums,
  personen, plaatsen, favorieten en herkomst klaar. Alleen de demo-gebruiker
  wordt aangeraakt.
`;
writeFileSync(join(target, 'LEESMIJ.txt'), readme, 'utf8');

console.log(`Export klaar in: ${target}`);
console.log(`  fotos/          ${copiedPhotos}`);
console.log(`  documenten/     ${copiedDocs}`);
console.log(`  foto-metadata.csv, document-metadata.csv, metadata-json/, LEESMIJ.txt`);
