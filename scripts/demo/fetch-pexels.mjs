#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Fetch real demo photos from Pexels (free stock, no attribution required) into
// apps/web/public/demo/photos/ using the exact filenames. Reproducible: the
// mapping filename → Pexels photo id lives in scripts/demo/pexels-ids.json, so
// re-running needs no web search. After running, execute `pnpm seed:demo` to
// refresh the media manifest — the resolver then serves these .jpg files.
//
// Orientation (landscape/portrait) is taken from the seeded dimensions so each
// crop matches the item. Only the Pexels image CDN is contacted.
// ---------------------------------------------------------------------------
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const outDir = join(repoRoot, 'apps', 'web', 'public', 'demo', 'photos');
const idsPath = join(here, 'pexels-ids.json');

const photos = JSON.parse(readFileSync(join(repoRoot, 'data/demo/demo-photos.json'), 'utf8')).photos;
const dims = new Map(photos.map((p) => [p.filename, { w: p.width, h: p.height }]));

let ids;
try {
  ids = JSON.parse(readFileSync(idsPath, 'utf8'));
} catch {
  console.error(`No ${idsPath}. It maps "<filename>.jpg": <pexels photo id>.`);
  process.exit(1);
}

function cdnUrl(id, landscape) {
  const [w, h] = landscape ? [1600, 1200] : [1200, 1600];
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;
}

async function download(id, landscape) {
  const res = await fetch(cdnUrl(id, landscape));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 20000 || buf[0] !== 0xff || buf[1] !== 0xd8) {
    throw new Error(`not a valid JPEG (${buf.length} bytes)`);
  }
  return buf;
}

const entries = Object.entries(ids).filter(([, id]) => id);
mkdirSync(outDir, { recursive: true });
let ok = 0;
const failed = [];
for (const [filename, id] of entries) {
  const d = dims.get(filename);
  const landscape = !d || d.w >= d.h;
  try {
    const buf = await download(id, landscape);
    writeFileSync(join(outDir, filename), buf);
    ok++;
    console.log(`✓ ${filename}  (pexels ${id}, ${landscape ? '1600×1200' : '1200×1600'})`);
  } catch (err) {
    failed.push(filename);
    console.warn(`✗ ${filename}  (pexels ${id}): ${err.message}`);
  }
}

console.log(`\n${ok}/${entries.length} downloaded. Now run:  pnpm seed:demo`);
if (failed.length) console.log(`Missing: ${failed.join(', ')}`);
