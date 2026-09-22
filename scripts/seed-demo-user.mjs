#!/usr/bin/env node
/**
 * Key-less demo seeder: creates + populates the shared demo account WITHOUT the
 * service-role key. Works entirely as the demo user under RLS:
 *   - signUp (anon key) creates the account; email is confirmed out-of-band.
 *   - uploads synthetic media to the owner's storage path,
 *   - records items via the archive_ingest_item RPC (auth.uid-scoped),
 *   - builds albums / people / places / favourites.
 *
 * jpeg photos get on-the-fly Supabase thumbnails (no derivative needed); videos
 * play in the detail view via a signed URL. Run twice if the account needs email
 * confirmation in between (the operator confirms via SQL): the second run signs
 * in and seeds.
 *
 * Env (from apps/web/.env.local): NEXT_PUBLIC_SUPABASE_URL,
 * NEXT_PUBLIC_SUPABASE_ANON_KEY. DEMO_EMAIL/DEMO_PASSWORD optional.
 */
import { readFileSync, existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const requireFromApp = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { createClient } = requireFromApp('@supabase/supabase-js');
const sharp = requireFromApp('sharp');
const ffmpegPath = requireFromApp('ffmpeg-static');

function loadEnv() {
  const file = 'apps/web/.env.local';
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL = process.env.DEMO_EMAIL || 'demo@bewora.nl';
const PASSWORD = process.env.DEMO_PASSWORD || 'bewora-demo-2026';
const BUCKET = 'archief';
if (!URL_ || !ANON) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(URL_, ANON, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const storageKey = (uid, sha) => `archive/${uid}/${sha.slice(0, 2)}/${sha}`;

const PALETTE = [
  ['#1D3D2A', '#3E6B4F'], ['#B4783C', '#E0A96D'], ['#2E4A6B', '#6E93C0'],
  ['#6B2E4A', '#C06E93'], ['#4A6B2E', '#93C06E'], ['#6B5A2E', '#C0A96E'],
];
async function photoBuffer(label, i) {
  const [a, b] = PALETTE[i % PALETTE.length];
  const svg = `<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="1200" height="900" fill="url(#g)"/>
    <circle cx="${200 + ((i * 120) % 800)}" cy="${250 + ((i * 90) % 400)}" r="140" fill="#ffffff22"/>
    <text x="60" y="820" font-family="Helvetica, Arial, sans-serif" font-size="62" font-weight="600" fill="#fff">${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer();
}
function runFfmpeg(args) {
  return new Promise((res, rej) => {
    if (!ffmpegPath) return rej(new Error('no ffmpeg'));
    const p = spawn(ffmpegPath, args, { stdio: 'ignore' });
    p.on('error', rej);
    p.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
  });
}
async function videoBuffer(color, seconds, i) {
  const dir = await mkdtemp(join(tmpdir(), 'demo-vid-'));
  const out = join(dir, 'out.mp4');
  try {
    await runFfmpeg(['-y', '-f', 'lavfi', '-i', `color=c=${color}:s=640x480:d=${seconds}:r=24`,
      '-f', 'lavfi', '-i', `sine=frequency=${220 + i * 40}:duration=${seconds}`,
      '-pix_fmt', 'yuv420p', '-shortest', out]);
    return await readFile(out);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

const now = new Date();
const iso = (d) => d.toISOString();
const monthsAgo = (n, day = 12) => new Date(now.getFullYear(), now.getMonth() - n, day, 14, 30, 0);
const yearsAgoToday = (n) => new Date(now.getFullYear() - n, now.getMonth(), now.getDate(), 10, 0, 0);
const PLACES = [
  { name: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
  { name: 'Toscane', lat: 43.7711, lon: 11.2486 },
];
const PHOTOS = ['Zomer in de tuin', 'Verjaardag', 'Stranddag', 'Wandeling in het bos', 'Kerstavond',
  'Nieuwjaar', 'Op de fiets', 'Uit eten', 'Concert', 'Sneeuwpret', 'Op het terras', 'Familiediner',
  'Boottocht', 'Herfstkleuren', 'Marktdag', 'Zonsondergang', 'Picknick', 'Verkleedfeest', 'Op reis', 'Thuis op de bank'];

async function ingest(accountId, uid, item) {
  const sha = sha256(item.bytes);
  const key = storageKey(uid, sha);
  const up = await supabase.storage.from(BUCKET).upload(key, item.bytes, {
    contentType: item.mime,
    upsert: true,
  });
  if (up.error) throw up.error;
  const { data, error } = await supabase.rpc('archive_ingest_item', {
    p_connector_account_id: accountId,
    p_type: item.type,
    p_original_filename: item.filename,
    p_mime_type: item.mime,
    p_file_size: item.bytes.length,
    p_checksum_sha256: sha,
    p_storage_provider: 'supabase',
    p_storage_key: key,
    p_source_item_id: sha,
    p_created_at_source: item.takenAt ?? null,
    p_metadata: {
      takenAt: item.takenAt ?? null,
      latitude: item.lat ?? null,
      longitude: item.lon ?? null,
      width: item.width ?? null,
      height: item.height ?? null,
      durationMs: item.durationMs ?? null,
      camera: item.camera ?? null,
    },
  });
  if (error) throw error;
  return data.item_id;
}

async function main() {
  // 1. Ensure account exists (signUp is idempotent-ish; ignore "already registered").
  const { error: signErr } = await supabase.auth.signUp({ email: EMAIL, password: PASSWORD });
  if (signErr && !/already registered|already exists/i.test(signErr.message)) {
    console.error('signUp:', signErr.message);
  }
  // 2. Sign in.
  const { data: session, error: inErr } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (inErr || !session?.user) {
    console.error(
      `\nCannot sign in yet: ${inErr?.message ?? 'no session'}.` +
        `\nThe account likely needs email confirmation. Confirm it (operator, via SQL):` +
        `\n  update auth.users set email_confirmed_at = now() where email = '${EMAIL}';` +
        `\nthen re-run this script.`,
    );
    process.exit(2);
  }
  const uid = session.user.id;
  console.log('demo user id:', uid);

  // 3. Reset previous demo content (RLS: own rows only).
  console.log('→ wiping previous content…');
  await supabase.from('archive_items').delete().eq('owner_id', uid);
  await supabase.from('archive_albums').delete().eq('owner_id', uid);
  await supabase.from('archive_people').delete().eq('owner_id', uid);
  await supabase.from('archive_places').delete().eq('owner_id', uid);
  await supabase.from('connector_accounts').delete().eq('user_id', uid);

  const { data: acct, error: acctErr } = await supabase
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
  if (acctErr) throw acctErr;

  console.log('→ photos…');
  const photoIds = [];
  for (let i = 0; i < PHOTOS.length; i++) {
    const bytes = await photoBuffer(PHOTOS[i], i);
    const taken = i === 0 ? yearsAgoToday(1) : i === 1 ? yearsAgoToday(3) : monthsAgo(i, ((i * 7) % 26) + 1);
    const place = i % 5 === 0 ? PLACES[(i / 5) % PLACES.length] : null;
    const id = await ingest(acct.id, uid, {
      bytes, type: 'photo', filename: `${PHOTOS[i]}.jpg`, mime: 'image/jpeg',
      takenAt: iso(taken), width: 1200, height: 900,
      camera: i % 3 === 0 ? 'iPhone 15' : 'Canon EOS', lat: place?.lat, lon: place?.lon,
    });
    photoIds.push({ id, place });
  }

  console.log('→ videos…');
  const vids = [['0x1D3D2A', 'Vakantievideo'], ['0xB4783C', 'Verjaardagsclip'], ['0x2E4A6B', 'Winterpret']];
  for (let i = 0; i < vids.length; i++) {
    const seconds = 3 + i;
    const bytes = await videoBuffer(vids[i][0], seconds, i);
    await ingest(acct.id, uid, {
      bytes, type: 'video', filename: `${vids[i][1]}.mp4`, mime: 'video/mp4',
      takenAt: iso(monthsAgo(i * 2 + 1)), width: 640, height: 480, durationMs: seconds * 1000,
    });
  }

  console.log('→ documents…');
  const DOCS = ['Reisschema Italië.txt', 'Recept van oma.txt', 'Garantie fiets.txt'];
  for (let i = 0; i < DOCS.length; i++) {
    await ingest(acct.id, uid, {
      bytes: Buffer.from(`${DOCS[i]}\n\nVoorbeelddocument in de Bewora-demo. Regel ${i + 1}.\n`, 'utf8'),
      type: 'document', filename: DOCS[i], mime: 'text/plain', takenAt: iso(monthsAgo(i + 2)),
    });
  }

  console.log('→ albums, people, places, favourites…');
  const ids = photoIds.map((p) => p.id);
  const albums = [
    ['Zomer 2024', ids.slice(0, 6)],
    ['Familie', ids.slice(6, 12)],
    ['Op reis', ids.slice(12, 16)],
  ];
  for (const [title, items] of albums) {
    const { data: al } = await supabase.from('archive_albums').insert({ owner_id: uid, title }).select('id').single();
    let pos = 0;
    for (const itemId of items) await supabase.from('archive_album_items').insert({ album_id: al.id, archive_item_id: itemId, position: pos++ });
  }
  const people = [
    ['Oma Riet', ids.slice(0, 5)],
    ['Papa', ids.slice(5, 10)],
    ['Lisa', ids.slice(10, 15)],
  ];
  for (const [name, items] of people) {
    const { data: pr } = await supabase.from('archive_people').insert({ owner_id: uid, display_name: name }).select('id').single();
    for (const itemId of items) await supabase.from('archive_item_people').insert({ person_id: pr.id, archive_item_id: itemId });
  }
  for (const place of PLACES) {
    const { data: pl } = await supabase.from('archive_places').insert({ owner_id: uid, name: place.name, latitude: place.lat, longitude: place.lon }).select('id').single();
    const tagged = photoIds.filter((p) => p.place?.name === place.name).map((p) => p.id);
    for (const itemId of tagged.length ? tagged : ids.slice(0, 3)) await supabase.from('archive_item_places').insert({ place_id: pl.id, archive_item_id: itemId });
  }
  for (const itemId of ids.filter((_, i) => i % 4 === 0)) {
    await supabase.from('archive_item_flags').insert({ owner_id: uid, archive_item_id: itemId, favourite: true });
  }

  console.log('\n✅ Demo seeded. Set in Vercel (Production):');
  console.log(`   NEXT_PUBLIC_DEMO_USER_ID=${uid}`);
  console.log(`   DEMO_EMAIL=${EMAIL}`);
  console.log(`   DEMO_PASSWORD=${PASSWORD}`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
