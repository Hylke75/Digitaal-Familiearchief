#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Bewora demo seed (file-backed mode).
// Expands scripts/demo/demo-source.mjs into the normalised, validated JSON the
// app reads at /data/demo/*.json, writes the image-prompts manifest, and
// (via generate-demo-placeholders.mjs) ensures every media placeholder exists.
//
// Idempotent: running twice produces byte-identical output (deterministic; no
// timestamps, no randomness). This is `pnpm seed:demo` when no Supabase target
// is configured. It NEVER writes to a database and NEVER touches production.
// ---------------------------------------------------------------------------
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  SOURCES,
  PHOTOS,
  PEOPLE,
  ALBUM_NAMES,
  SMART_ALBUMS,
  FOLDERS,
  DOCUMENTS,
  DOCUMENT_CATEGORIES,
  MEMORIES,
  REGION_CENTROIDS,
} from './demo-source.mjs';
import { generatePlaceholders } from './generate-demo-placeholders.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const dataDir = join(repoRoot, 'data', 'demo');
const publicPhotos = join(repoRoot, 'apps', 'web', 'public', 'demo', 'photos');
const publicDocs = join(repoRoot, 'apps', 'web', 'public', 'demo', 'documents');

const pad3 = (n) => String(n).padStart(3, '0');
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

function sourceLabel(key) {
  return SOURCES[key]?.label ?? key;
}

// ----- photos ---------------------------------------------------------------
function buildPhotos() {
  return PHOTOS.map((p) => {
    const id = `demo-photo-${pad3(p.n)}`;
    const sources = [{ key: p.source, label: sourceLabel(p.source), primary: true, sourceDeletedAt: null }];
    for (const a of p.also ?? []) {
      const key = typeof a === 'string' ? a : a.key;
      const deleted = typeof a === 'object' && a.deleted;
      sources.push({
        key,
        label: sourceLabel(key),
        primary: false,
        // A source relation whose provider copy disappeared (§49). The canonical
        // item stays visible everywhere; only the source link is tombstoned.
        sourceDeletedAt: deleted ? '2026-05-01T00:00:00Z' : null,
      });
    }
    const versions = (p.versions ?? []).map((v, i) => ({
      id: `${id}-version-${i + 1}`,
      filename: `${p.file.replace(/\.jpg$/, '')}_${v.sourceKey}.jpg`,
      label: v.label,
      note: v.note ?? null,
      sourceKey: v.sourceKey,
      sourceLabel: sourceLabel(v.sourceKey),
      relationship: v.relationship,
    }));

    // Deterministic dimensions for variety (most landscape, a few portrait).
    const portrait = p.portrait ?? [12, 22, 29].includes(p.n);
    const width = portrait ? 3024 : 4032;
    const height = portrait ? 4032 : 3024;

    const override = p.override ?? null;
    return {
      id,
      type: 'photo',
      n: p.n,
      filename: p.file,
      title: p.title,
      originSource: p.source,
      sources,
      versions,
      capturedAt: p.captured,
      datePrecision: p.datePrecision ?? 'EXACT_TIME',
      place: override?.place?.value ?? p.place ?? null,
      providerPlace: override?.place?.providerValue ?? null,
      city: p.city ?? null,
      country: p.country ?? null,
      lat: p.lat ?? null,
      lng: p.lng ?? null,
      locationSource: p.locSource ?? (p.lat != null ? 'EXIF' : 'UNKNOWN'),
      region: p.region ?? null,
      albums: p.albums ?? [],
      people: p.people ?? [],
      tags: p.tags ?? [],
      favorite: Boolean(p.favorite),
      width,
      height,
      hasUserOverride: Boolean(override),
      is_demo: true,
    };
  });
}

// ----- people ---------------------------------------------------------------
function buildPeople() {
  return PEOPLE.map((person, i) => ({
    id: `demo-person-${pad3(i + 1)}`,
    name: person.name,
    role: person.role,
    color: person.color,
    is_demo: true,
  }));
}

// ----- albums ---------------------------------------------------------------
function buildAlbums(photos) {
  const referenced = new Set();
  for (const p of photos) for (const a of p.albums) referenced.add(a);
  // §10 list first (stable order), then any extra album referenced by a photo.
  const ordered = [...ALBUM_NAMES];
  for (const name of referenced) if (!ordered.includes(name)) ordered.push(name);
  const albums = ordered.map((title, i) => ({
    id: `demo-album-${pad3(i + 1)}`,
    title,
    type: 'user',
    is_demo: true,
  }));
  const smartAlbums = SMART_ALBUMS.map((s) => ({ ...s, type: 'smart', is_demo: true }));
  return { albums, smartAlbums };
}

// ----- documents ------------------------------------------------------------
function buildDocuments() {
  return DOCUMENTS.map((d, i) => {
    const id = `demo-doc-${pad3(i + 1)}`;
    const placeholder = `${pad3(i + 1)}_${slug(d.title)}.pdf`;
    return {
      id,
      type: 'document',
      title: d.title,
      filename: d.title,
      placeholder,
      category: d.category,
      source: d.source,
      sourceLabel: sourceLabel(d.source),
      folder: d.folder,
      documentDate: d.date,
      modifiedAt: `${d.date}T09:00:00Z`,
      mimeType: 'application/pdf',
      fileSize: 90000 + (i + 1) * 13000,
      tags: d.tags ?? [],
      is_demo: true,
    };
  });
}

// ----- memories -------------------------------------------------------------
function buildMemories(photos, documents) {
  const photoIdByN = new Map(photos.map((p) => [p.n, p.id]));
  const docIdByTitle = new Map(documents.map((d) => [d.title, d.id]));
  return MEMORIES.map((m, i) => ({
    id: `demo-memory-${pad3(i + 1)}`,
    title: m.title,
    date: m.date,
    datePrecision: m.datePrecision,
    place: m.place ?? null,
    story: m.story,
    photoIds: (m.photoNs ?? []).map((n) => photoIdByN.get(n)).filter(Boolean),
    documentIds: (m.docTitles ?? []).map((t) => docIdByTitle.get(t)).filter(Boolean),
    externalReference: m.externalReference ?? null,
    is_demo: true,
  }));
}

// ----- image prompts manifest (§17) ----------------------------------------
const IMAGE_PROMPTS = [
  ['01_gezin_strand_scheveningen.jpg', 'A warm, natural family photo on a Dutch beach at sunset, father, partner and two teenage sons walking barefoot near the shoreline, relaxed candid moment, realistic photography, soft evening light, premium lifestyle feel, natural colors, documentary style, high detail'],
  ['02_koffie_keukentafel.jpg', 'A candid morning scene in a modern Dutch kitchen, a middle-aged Dutch man sitting at a wooden table with coffee and a laptop, warm natural daylight, calm premium lifestyle photography, realistic home interior, minimal Scandinavian style, authentic moment'],
  ['03_zonen_fiets.jpg', 'Two teenage boys cycling through a quiet Dutch neighborhood on a bright spring afternoon, candid family photography, realistic, natural movement, trees and brick houses in the background, warm documentary feel'],
  ['04_verjaardagsdiner_thuis.jpg', 'A cozy birthday dinner at home with family and close friends around a long wooden table, candles, wine glasses, warm lights, Dutch townhouse interior, candid premium lifestyle photography, realistic, intimate atmosphere'],
  ['05_selfie_wandeling.jpg', 'A casual walking selfie of a middle-aged Dutch man and his partner in a city park, slightly informal phone-camera look, natural smiling expression, realistic photography, overcast daylight, candid and authentic'],
  ['06_tennis_madeira.jpg', 'A bright sunny tennis court in Madeira, a middle-aged man preparing to serve, palm trees and ocean view in the background, crisp daylight, sporty realistic travel photography, premium and natural look'],
  ['07_uitzichtpunt_madeira.jpg', 'A breathtaking viewpoint in Madeira with steep green cliffs and the Atlantic Ocean, family standing near a railing enjoying the view, realistic travel photography, vivid but natural colors, premium landscape composition'],
  ['08_levada_wandeling.jpg', 'A scenic levada hiking trail in Madeira through lush forest, family walking on a narrow path with water channel beside them, soft natural light, realistic documentary travel photo, detailed greenery, authentic outdoor feel'],
  ['09_diner_funchal.jpg', 'A stylish outdoor dinner on a terrace in Funchal at blue hour, family seated around a table with local dishes, city lights in the background, warm realistic travel photography, elegant but authentic'],
  ['10_fanal_forest.jpg', 'A moody hike through the misty Fanal forest in Madeira, ancient twisted trees, family walking along a forest path, atmospheric travel photography, realistic fog, cinematic but natural, high detail'],
  ['11_parijs_straatbeeld.jpg', 'A refined travel photo of a Paris street with classic architecture, cafe terrace, and a couple walking hand in hand, soft morning light, realistic travel photography, elegant and timeless'],
  ['12_hotelkamer_parijs.jpg', 'A tasteful boutique hotel room in Paris with open suitcase, city map, soft morning light through curtains, realistic lifestyle photography, intimate travel moment, premium editorial feel'],
  ['13_golden_gate_gezin.jpg', 'A family travel photo in front of the Golden Gate Bridge in San Francisco, natural smiles, bright but slightly misty weather, realistic tourist photography, authentic and warm'],
  ['14_roadtrip_woestijn.jpg', 'A rental car stopped at a scenic desert roadside in the American Southwest, wide open road, dramatic landscape, golden afternoon light, realistic travel photography, cinematic but documentary'],
  ['15_yosemite_wandeling.jpg', 'A family hiking in Yosemite National Park, granite cliffs and pine trees in the background, bright clean daylight, realistic travel documentary photo, outdoor premium aesthetic'],
  ['16_scan_tuin_1978.jpg', 'A vintage 1978 family photo in a Dutch backyard, slightly faded colors, analog photography look, parents with small children, summer garden setting, authentic scanned-photo aesthetic with mild grain and age texture'],
  ['17_trouwfoto_1964_bw.jpg', 'A classic black and white wedding portrait from the 1960s, Dutch couple standing formally outside a church, authentic vintage photography, slightly soft focus, realistic scanned archival look'],
  ['18_schoolfoto_1985.jpg', 'A posed Dutch school photo from the mid-1980s, teenager with simple background, authentic analog portrait style, slightly faded colors, scanned print feeling, realistic vintage aesthetic'],
  ['19_woning_buitenkant.jpg', 'A clean realistic exterior photo of a modern Dutch family home on a quiet street, soft afternoon light, documentary real-estate style photo, warm and natural'],
  ['20_verhuisdozen_sleutels.jpg', 'A candid moving-day moment inside a new home, stacked cardboard boxes, a couple holding keys and smiling, realistic lifestyle photography, natural light, warm emotional feel'],
  ['21_netwerkborrel_venue.jpg', 'A professional networking event in a stylish Dutch cultural venue, people holding drinks and talking in small groups, ambient warm lighting, realistic corporate event photography, premium atmosphere'],
  ['22_spreken_podium.jpg', 'A middle-aged Dutch man speaking on stage at a business event, large screen behind him, confident presentation moment, realistic event photography, dynamic but authentic'],
  ['23_kantooroverleg.jpg', 'A small team meeting around a table in a modern office with laptops and notebooks, collaborative atmosphere, realistic business photography, natural indoor light, premium but candid'],
  ['24_boekpresentatie.jpg', 'A book presentation moment at a cultural event, a presenter holding up a new book while audience watches, warm indoor light, realistic event documentation, elegant and professional'],
  ['25_familie_bbq_whatsapp.jpg', 'A casual phone-camera style family barbecue in a backyard, children and adults gathered around a grill, spontaneous candid composition, summer evening, realistic and slightly imperfect smartphone photography'],
  ['26_hond_op_bank.jpg', 'A cozy candid smartphone photo of a dog sleeping on a sofa in a family living room, soft indoor light, realistic and informal, authentic everyday moment'],
  ['27_instagram_koffie.jpg', 'A beautifully styled cappuccino on a marble cafe table with sunglasses and a notebook, soft natural light, elegant Instagram-worthy lifestyle composition, realistic, minimal and tasteful'],
  ['28_instagram_strand_zonsondergang.jpg', 'A visually striking sunset over the sea at Scheveningen beach, silhouettes of people walking near the water, warm glowing sky, realistic but aesthetically composed social-media-style photography'],
  ['29_paspoort_tafel.jpg', 'A realistic overhead smartphone photo of a generic European-style passport-like travel document on a wooden table next to reading glasses and a pen, fictional and non-readable personal details, clean natural light, document-photo style'],
  ['30_koopakte_contractmap.jpg', 'A realistic top-down photo of a neatly organized fictional house purchase contract folder and generic documents on a desk, no readable personal data, premium lifestyle-documentary style, natural light'],
];

function imagePromptsMarkdown() {
  const lines = [
    '# Bewora demo — photorealistic image prompts',
    '',
    'These are the generation prompts for the 30 demo photos (spec §17). Generate',
    'each image and drop it into `apps/web/public/demo/photos/` using the exact',
    'filename below. The app prefers the real `.jpg`; until it exists a',
    'deterministic Bewora-styled placeholder is shown automatically (no code',
    'change needed — see `resolveDemoMediaUrl`).',
    '',
    'All content is fictional demo material. Do not use real people or real',
    'personal data. For documents (29, 30) keep every detail non-readable.',
    '',
  ];
  for (const [file, prompt] of IMAGE_PROMPTS) {
    lines.push(`## ${file}`, '', `"${prompt}"`, '');
  }
  return lines.join('\n');
}

// ----- write ---------------------------------------------------------------
function writeJson(name, value) {
  writeFileSync(join(dataDir, name), JSON.stringify(value, null, 2) + '\n', 'utf8');
}

export function build({ quiet = false } = {}) {
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(publicPhotos, { recursive: true });
  mkdirSync(publicDocs, { recursive: true });

  const photos = buildPhotos();
  const people = buildPeople();
  const { albums, smartAlbums } = buildAlbums(photos);
  const documents = buildDocuments();
  const memories = buildMemories(photos, documents);

  writeJson('demo-photos.json', { generatedBy: 'scripts/demo/build-demo-data.mjs', count: photos.length, photos });
  writeJson('demo-people.json', { count: people.length, people });
  writeJson('demo-albums.json', { albums, smartAlbums });
  writeJson('demo-documents.json', { count: documents.length, categories: DOCUMENT_CATEGORIES, documents });
  writeJson('demo-folders.json', { folders: FOLDERS });
  writeJson('demo-memories.json', { count: memories.length, memories });
  writeJson('demo-places.json', { centroids: REGION_CENTROIDS });
  writeFileSync(join(dataDir, 'demo-image-prompts.md'), imagePromptsMarkdown(), 'utf8');

  // Placeholders (SVG photos + tiny PDFs) for anything not yet supplied as real.
  const ph = generatePlaceholders({ photos, documents, publicPhotos, publicDocs, quiet });

  // Media manifest: which real .jpg files exist now. The app's resolver reads
  // this to prefer a real photo over its placeholder. Re-run `pnpm seed:demo`
  // after dropping real photos in — no code change (§45).
  const missing = new Set(ph.missingRealPhotos);
  const mediaManifest = Object.fromEntries(photos.map((p) => [p.filename, !missing.has(p.filename)]));
  writeJson('media-manifest.json', { photos: mediaManifest });

  const report = {
    photos: photos.length,
    people: people.length,
    albums: albums.length,
    smartAlbums: smartAlbums.length,
    documents: documents.length,
    memories: memories.length,
    sourcesPhoto: countBy(photos.flatMap((p) => p.sources.map((s) => s.key))),
    sourcesDocument: countBy(documents.map((d) => d.source)),
    categories: countBy(documents.map((d) => d.category)),
    placeholders: ph,
  };
  if (!quiet) {
    console.log('Bewora demo seed (file-backed) — written to /data/demo\n');
    console.log(JSON.stringify(report, null, 2));
  }
  return report;
}

function countBy(arr) {
  const out = {};
  for (const k of arr) out[k] = (out[k] ?? 0) + 1;
  return out;
}

// Run when invoked directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  build();
}
