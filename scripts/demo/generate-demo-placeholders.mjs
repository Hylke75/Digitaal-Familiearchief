#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Deterministic demo placeholders (spec §5, §14, §44). No dependencies, no
// remote services. Photos → Bewora-styled SVGs (correct aspect ratio, title,
// source, year, visually distinct). Documents → small valid PDFs with a clear
// DEMO banner and only fictional metadata.
//
// The app's resolveDemoMediaUrl() prefers a real .jpg/.pdf when present and
// falls back to these placeholders, so real files can be dropped in later with
// no code change.
// ---------------------------------------------------------------------------
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const FOREST = '#1D3D2A';
const PAPER = '#FAF6F1';
const INK = '#1B211D';
const BRASS = '#9B5B19';
const SOURCE_BRAND = {
  apple_photos: '#333333',
  whatsapp: '#25D366',
  instagram: '#C13584',
  facebook: '#1877F2',
  google_photos: '#4285F4',
  manual_upload: '#9B5B19',
  google_drive: '#1FA463',
  onedrive: '#0364B8',
  dropbox: '#0061FF',
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ASCII-fold for the built-in PDF font (WinAnsi-safe).
const asciiFold = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7e]/g, '');

function photoSvg(photo) {
  const brand = SOURCE_BRAND[photo.originSource] ?? BRASS;
  const w = photo.width ?? 4032;
  const h = photo.height ?? 3024;
  // Scale intrinsic size so the long side is 1600px (keeps files tiny).
  const scale = 1600 / Math.max(w, h);
  const sw = Math.round(w * scale);
  const sh = Math.round(h * scale);
  const year = String(photo.capturedAt ?? '').slice(0, 4) || '—';
  const sourceLabel = photo.sources?.[0]?.label ?? '';
  const cx = w / 2;
  const bandH = Math.round(h * 0.14);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${sw}" height="${sh}" role="img" aria-label="${esc(photo.title)}">
  <rect width="${w}" height="${h}" fill="${PAPER}"/>
  <rect width="${w}" height="${h}" fill="${brand}" opacity="0.06"/>
  <rect x="0" y="0" width="${w}" height="${bandH}" fill="${brand}" opacity="0.9"/>
  <text x="${Math.round(w * 0.04)}" y="${Math.round(bandH * 0.62)}" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(bandH * 0.42)}" font-weight="700" fill="#ffffff">Bewora</text>
  <text x="${cx}" y="${Math.round(h * 0.52)}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(h * 0.28)}" font-weight="800" fill="${brand}" opacity="0.12">${esc(year)}</text>
  <text x="${cx}" y="${Math.round(h * 0.66)}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(h * 0.062)}" font-weight="700" fill="${INK}">${esc(photo.title)}</text>
  <text x="${cx}" y="${Math.round(h * 0.74)}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(h * 0.04)}" fill="${FOREST}">${esc(sourceLabel)} · ${esc(year)}</text>
  <text x="${cx}" y="${Math.round(h * 0.94)}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(h * 0.03)}" fill="#59635C">Demo-placeholder · vervang door echte foto</text>
</svg>`;
}

// Minimal, valid single-page PDF with Helvetica text lines.
function makePdf(lines) {
  const content =
    'BT\n/F1 16 Tf\n60 790 Td\n20 TL\n' +
    lines
      .map((l) => {
        const t = asciiFold(l).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        return `(${t}) Tj T*`;
      })
      .join('\n') +
    '\nET';
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>',
    `<</Length ${Buffer.byteLength(content, 'latin1')}>>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

function documentPdf(doc) {
  return makePdf([
    'DEMO DOCUMENT',
    '',
    doc.title,
    '',
    `Categorie: ${doc.category}`,
    `Bron: ${doc.sourceLabel ?? doc.source}`,
    `Map: ${doc.folder ?? 'Handmatig toegevoegd'}`,
    `Documentdatum: ${doc.documentDate}`,
    '',
    'Dit document bevat uitsluitend fictieve demogegevens.',
  ]);
}

/**
 * Write a placeholder for every photo/document that does not yet have a real
 * asset. Returns which real files are still missing (placeholder in use).
 */
export function generatePlaceholders({ photos, documents, publicPhotos, publicDocs, quiet = false }) {
  mkdirSync(publicPhotos, { recursive: true });
  mkdirSync(publicDocs, { recursive: true });
  const missingPhotos = [];
  const missingDocs = [];

  for (const photo of photos) {
    const realJpg = join(publicPhotos, photo.filename);
    const svgPath = join(publicPhotos, photo.filename.replace(/\.jpg$/i, '.svg'));
    writeFileSync(svgPath, photoSvg(photo), 'utf8');
    if (!existsSync(realJpg)) missingPhotos.push(photo.filename);
    // Version placeholders (e.g. WhatsApp-compressed) share the base look.
    for (const v of photo.versions ?? []) {
      const vsvg = join(publicPhotos, v.filename.replace(/\.jpg$/i, '.svg'));
      writeFileSync(vsvg, photoSvg({ ...photo, title: `${photo.title} — ${v.label}` }), 'utf8');
    }
  }
  for (const doc of documents) {
    const realPdf = join(publicDocs, doc.placeholder);
    writeFileSync(join(publicDocs, doc.placeholder), documentPdf(doc));
    // The document placeholder IS a valid PDF, so nothing is "missing"; we still
    // report whether a curated real PDF was supplied under the same name.
    if (!existsSync(realPdf)) missingDocs.push(doc.placeholder);
  }

  if (!quiet) {
    console.log(`placeholders: ${photos.length} photo SVGs, ${documents.length} document PDFs written`);
  }
  return { missingRealPhotos: missingPhotos, documentPlaceholders: documents.length };
}

// Allow standalone run (regenerates from the built JSON).
if (import.meta.url === `file://${process.argv[1]}`) {
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(here, '..', '..');
  const { readFileSync } = await import('node:fs');
  const photos = JSON.parse(readFileSync(join(repoRoot, 'data/demo/demo-photos.json'), 'utf8')).photos;
  const documents = JSON.parse(readFileSync(join(repoRoot, 'data/demo/demo-documents.json'), 'utf8')).documents;
  generatePlaceholders({
    photos,
    documents,
    publicPhotos: join(repoRoot, 'apps/web/public/demo/photos'),
    publicDocs: join(repoRoot, 'apps/web/public/demo/documents'),
  });
}
