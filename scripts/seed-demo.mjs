#!/usr/bin/env node
/**
 * Seed the shared public demo account with synthetic content so visitors can
 * experience the real Bewora app (timeline, albums, people, places, search,
 * thumbnails, video posters) without anyone sharing real files.
 *
 * Run locally with the service-role key (bypasses RLS). It:
 *   1. ensures the demo auth user exists,
 *   2. wipes any previous demo content (idempotent),
 *   3. generates synthetic photos (sharp), short videos (ffmpeg) and documents,
 *   4. uploads originals + records archive_items with capture metadata,
 *   5. generates thumbnails/posters (archive_derivatives),
 *   6. builds albums, people, places and favourites.
 *
 * Env (read from apps/web/.env.local if present, else process.env):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (required)
 *   DEMO_EMAIL (default demo@bewora.nl), DEMO_PASSWORD (default random-ish)
 *
 * Prints the values to set in Vercel: NEXT_PUBLIC_DEMO_USER_ID, DEMO_EMAIL,
 * DEMO_PASSWORD.
 */
import { readFileSync, existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

// Resolve third-party deps from the web app's node_modules (pnpm doesn't hoist
// them to the repo root), so this script runs from anywhere.
const requireFromApp = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { createClient } = requireFromApp('@supabase/supabase-js');
const sharp = requireFromApp('sharp');
const ffmpegPath = requireFromApp('ffmpeg-static');

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------
function loadEnv() {
  const file = 'apps/web/.env.local';
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@bewora.nl';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'bewora-demo-2026';
const BUCKET = 'archief';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const storageKey = (uid, sha) => `archive/${uid}/${sha.slice(0, 2)}/${sha}`;
const thumbKey = (uid, id) => `archive/${uid}/thumb/${id}.webp`;
const posterKey = (uid, id) => `archive/${uid}/poster/${id}.webp`;

// ---------------------------------------------------------------------------
// Synthetic media
// ---------------------------------------------------------------------------
const PALETTE = [
  ['#1D3D2A', '#3E6B4F'],
  ['#B4783C', '#E0A96D'],
  ['#2E4A6B', '#6E93C0'],
  ['#6B2E4A', '#C06E93'],
  ['#4A6B2E', '#93C06E'],
  ['#6B5A2E', '#C0A96E'],
];

async function photoBuffer(label, i) {
  const [a, b] = PALETTE[i % PALETTE.length];
  const svg = `<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </linearGradient></defs>
    <rect width="1200" height="900" fill="url(#g)"/>
    <circle cx="${200 + ((i * 120) % 800)}" cy="${250 + ((i * 90) % 400)}" r="140" fill="#ffffff22"/>
    <text x="60" y="820" font-family="Helvetica, Arial, sans-serif" font-size="62"
      font-weight="600" fill="#ffffff">${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer();
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) return reject(new Error('ffmpeg unavailable'));
    const p = spawn(ffmpegPath, args, { stdio: 'ignore' });
    p.on('error', reject);
    p.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg ${c}`))));
  });
}

async function videoBuffer(color, seconds, i) {
  const dir = await mkdtemp(join(tmpdir(), 'demo-vid-'));
  const out = join(dir, 'out.mp4');
  try {
    await runFfmpeg([
      '-y',
      '-f',
      'lavfi',
      '-i',
      `color=c=${color}:s=640x480:d=${seconds}:r=24`,
      '-f',
      'lavfi',
      '-i',
      `sine=frequency=${220 + i * 40}:duration=${seconds}`,
      '-pix_fmt',
      'yuv420p',
      '-shortest',
      out,
    ]);
    return await readFile(out);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

async function posterFromVideo(bytes) {
  const dir = await mkdtemp(join(tmpdir(), 'demo-poster-'));
  const inF = join(dir, 'in.mp4');
  const outF = join(dir, 'out.png');
  try {
    await writeFile(inF, bytes);
    await runFfmpeg([
      '-y',
      '-i',
      inF,
      '-frames:v',
      '1',
      '-vf',
      'scale=600:-1',
      '-f',
      'image2',
      outF,
    ]);
    return await readFile(outF);
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Content plan
// ---------------------------------------------------------------------------
const now = new Date();
const iso = (d) => d.toISOString();
const monthsAgo = (n, day = 12) => new Date(now.getFullYear(), now.getMonth() - n, day, 14, 30, 0);
const yearsAgoToday = (n) =>
  new Date(now.getFullYear() - n, now.getMonth(), now.getDate(), 10, 0, 0);

const PLACES = [
  { name: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
  { name: 'Toscane', lat: 43.7711, lon: 11.2486 },
];

const PHOTOS = [
  'Zomer in de tuin',
  'Verjaardag',
  'Stranddag',
  'Wandeling in het bos',
  'Kerstavond',
  'Nieuwjaar',
  'Op de fiets',
  'Uit eten',
  'Concert',
  'Sneeuwpret',
  'Op het terras',
  'Familiediner',
  'Boottocht',
  'Herfstkleuren',
  'Marktdag',
  'Zonsondergang',
  'Picknick',
  'Verkleedfeest',
  'Op reis',
  'Thuis op de bank',
];

async function main() {
  console.log('→ Ensuring demo user…');
  const uid = await ensureUser();
  console.log('   demo user id:', uid);

  console.log('→ Wiping previous demo content…');
  await wipe(uid);

  const { data: account } = await admin
    .from('connector_accounts')
    .insert({
      user_id: uid,
      connector_key: 'mock',
      display_name: 'Demo-bron',
      status: 'connected',
      connected_at: iso(now),
      last_successful_archive_at: iso(now),
    })
    .select('id')
    .single();
  const accountId = account.id;

  const photoIds = [];
  console.log('→ Photos…');
  for (let i = 0; i < PHOTOS.length; i++) {
    const label = PHOTOS[i];
    const bytes = await photoBuffer(label, i);
    // Spread dates; two land on "this day" in earlier years.
    let taken;
    if (i === 0) taken = yearsAgoToday(1);
    else if (i === 1) taken = yearsAgoToday(3);
    else taken = monthsAgo(i, ((i * 7) % 26) + 1);
    const place = i % 5 === 0 ? PLACES[(i / 5) % PLACES.length] : null;
    const id = await ingest(uid, accountId, {
      bytes,
      type: 'photo',
      filename: `${label}.jpg`,
      mime: 'image/jpeg',
      takenAt: iso(taken),
      width: 1200,
      height: 900,
      camera: i % 3 === 0 ? 'iPhone 15' : 'Canon EOS',
      lat: place?.lat,
      lon: place?.lon,
    });
    await makeThumb(uid, id, bytes);
    photoIds.push({ id, i, place });
  }

  console.log('→ Videos…');
  const videoIds = [];
  const vids = [
    { color: '0x1D3D2A', label: 'Vakantievideo' },
    { color: '0xB4783C', label: 'Verjaardagsclip' },
    { color: '0x2E4A6B', label: 'Winterpret' },
  ];
  for (let i = 0; i < vids.length; i++) {
    const seconds = 3 + i;
    const bytes = await videoBuffer(vids[i].color, seconds, i);
    const id = await ingest(uid, accountId, {
      bytes,
      type: 'video',
      filename: `${vids[i].label}.mp4`,
      mime: 'video/mp4',
      takenAt: iso(monthsAgo(i * 2 + 1)),
      width: 640,
      height: 480,
      durationMs: seconds * 1000,
    });
    const poster = await posterFromVideo(bytes);
    if (poster) await makePoster(uid, id, poster);
    videoIds.push(id);
  }

  console.log('→ Documents…');
  const DOCS = ['Reisschema Italië.txt', 'Recept van oma.txt', 'Garantie fiets.txt'];
  for (let i = 0; i < DOCS.length; i++) {
    const bytes = Buffer.from(
      `${DOCS[i]}\n\nDit is een voorbeelddocument in de Bewora-demo.\nRegel ${i + 1}.\n`,
      'utf8',
    );
    await ingest(uid, accountId, {
      bytes,
      type: 'document',
      filename: DOCS[i],
      mime: 'text/plain',
      takenAt: iso(monthsAgo(i + 2)),
    });
  }

  console.log('→ Albums, people, places, favourites…');
  await organise(uid, photoIds, videoIds);

  console.log('\n✅ Demo seeded. Set these in Vercel (Production):');
  console.log(`   NEXT_PUBLIC_DEMO_USER_ID=${uid}`);
  console.log(`   DEMO_EMAIL=${DEMO_EMAIL}`);
  console.log(`   DEMO_PASSWORD=${DEMO_PASSWORD}`);
}

// ---------------------------------------------------------------------------
async function ensureUser() {
  // Try to find an existing user by listing (small project) then create if absent.
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = list?.users?.find((u) => u.email === DEMO_EMAIL);
  if (found) return found.id;
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { demo: true },
  });
  if (error) throw error;
  // Give the profile a friendly first name for the greeting.
  await admin.from('profiles').upsert({ id: data.user.id, first_name: 'Demo' });
  return data.user.id;
}

async function wipe(uid) {
  await admin.from('archive_items').delete().eq('owner_id', uid); // cascades derivatives/links/sources/flags
  await admin.from('archive_albums').delete().eq('owner_id', uid);
  await admin.from('archive_people').delete().eq('owner_id', uid);
  await admin.from('archive_places').delete().eq('owner_id', uid);
  await admin.from('connector_accounts').delete().eq('user_id', uid);
}

async function ingest(uid, accountId, item) {
  const sha = sha256(item.bytes);
  const key = storageKey(uid, sha);
  await admin.storage.from(BUCKET).upload(key, item.bytes, {
    contentType: item.mime,
    upsert: true,
  });
  const { data, error } = await admin
    .from('archive_items')
    .insert({
      owner_id: uid,
      type: item.type,
      original_filename: item.filename,
      mime_type: item.mime,
      file_size: item.bytes.length,
      checksum_sha256: sha,
      created_at_source: item.takenAt ?? null,
      taken_at: item.takenAt ?? null,
      archived_at: iso(now),
      storage_provider: 'supabase',
      storage_key: key,
      status: 'archived',
      metadata_json: {},
      latitude: item.lat ?? null,
      longitude: item.lon ?? null,
      width: item.width ?? null,
      height: item.height ?? null,
      duration_ms: item.durationMs ?? null,
      camera: item.camera ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  await admin.from('archive_item_sources').insert({
    archive_item_id: data.id,
    connector_account_id: accountId,
    source_item_id: sha,
    source_created_at: item.takenAt ?? null,
  });
  return data.id;
}

async function makeThumb(uid, id, originalBytes) {
  const { data: out, info } = await sharp(originalBytes)
    .rotate()
    .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 60 })
    .toBuffer({ resolveWithObject: true });
  const key = thumbKey(uid, id);
  await admin.storage.from(BUCKET).upload(key, out, { contentType: 'image/webp', upsert: true });
  await admin.from('archive_derivatives').upsert(
    {
      archive_item_id: id,
      owner_id: uid,
      kind: 'thumb',
      storage_key: key,
      mime_type: 'image/webp',
      width: info.width,
      height: info.height,
      byte_size: out.length,
    },
    { onConflict: 'archive_item_id,kind', ignoreDuplicates: true },
  );
}

async function makePoster(uid, id, pngBytes) {
  const { data: out, info } = await sharp(pngBytes)
    .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 60 })
    .toBuffer({ resolveWithObject: true });
  const key = posterKey(uid, id);
  await admin.storage.from(BUCKET).upload(key, out, { contentType: 'image/webp', upsert: true });
  await admin.from('archive_derivatives').upsert(
    {
      archive_item_id: id,
      owner_id: uid,
      kind: 'poster',
      storage_key: key,
      mime_type: 'image/webp',
      width: info.width,
      height: info.height,
      byte_size: out.length,
    },
    { onConflict: 'archive_item_id,kind', ignoreDuplicates: true },
  );
}

async function organise(uid, photoIds, videoIds) {
  const ids = photoIds.map((p) => p.id);
  // Albums
  const albums = [
    { title: 'Zomer 2024', items: ids.slice(0, 6) },
    { title: 'Familie', items: ids.slice(6, 12) },
    { title: 'Op reis', items: [...ids.slice(12, 16), ...videoIds.slice(0, 1)] },
  ];
  for (const a of albums) {
    const { data: album } = await admin
      .from('archive_albums')
      .insert({ owner_id: uid, title: a.title })
      .select('id')
      .single();
    let pos = 0;
    for (const itemId of a.items) {
      await admin
        .from('archive_album_items')
        .insert({ album_id: album.id, archive_item_id: itemId, position: pos++ });
    }
  }
  // People
  const people = [
    { name: 'Oma Riet', items: ids.slice(0, 5) },
    { name: 'Papa', items: ids.slice(5, 10) },
    { name: 'Lisa', items: ids.slice(10, 15) },
  ];
  for (const p of people) {
    const { data: person } = await admin
      .from('archive_people')
      .insert({ owner_id: uid, display_name: p.name })
      .select('id')
      .single();
    for (const itemId of p.items) {
      await admin
        .from('archive_item_people')
        .insert({ person_id: person.id, archive_item_id: itemId });
    }
  }
  // Places (from the geo-tagged photos)
  for (const place of PLACES) {
    const { data: row } = await admin
      .from('archive_places')
      .insert({ owner_id: uid, name: place.name, latitude: place.lat, longitude: place.lon })
      .select('id')
      .single();
    const tagged = photoIds.filter((p) => p.place?.name === place.name).map((p) => p.id);
    for (const itemId of tagged.length ? tagged : ids.slice(0, 3)) {
      await admin.from('archive_item_places').insert({ place_id: row.id, archive_item_id: itemId });
    }
  }
  // Favourites
  for (const itemId of ids.filter((_, i) => i % 4 === 0)) {
    await admin
      .from('archive_item_flags')
      .insert({ owner_id: uid, archive_item_id: itemId, favourite: true });
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
