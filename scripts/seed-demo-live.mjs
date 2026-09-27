#!/usr/bin/env node
/**
 * Seed the shared bewora.nl demo account with the FULL rich demo library:
 * the 90 real photos + metadata from /data/demo (source provenance, albums,
 * people, places, favourites) and the 24 demo documents. Replaces the old
 * synthetic placeholder seed.
 *
 * Runs with the service-role key (bypasses RLS) so it can create the demo user,
 * upload originals to the private `archief` bucket, and write archive rows +
 * thumbnails. It only ever touches the demo user's own rows (wipe is
 * owner-scoped) — real users' 2600+ items are never affected.
 *
 * Prereqs — put these in apps/web/.env.local (or the process env):
 *   NEXT_PUBLIC_SUPABASE_URL          (present)
 *   SUPABASE_SERVICE_ROLE_KEY         (from Vercel → Settings → Environment,
 *                                      or Supabase dashboard → API)
 *   DEMO_EMAIL     (default demo@bewora.nl)
 *   DEMO_PASSWORD  (only used if the demo user must be created)
 *
 * Run:  node scripts/seed-demo-live.mjs
 * Then set in Vercel (Production) and redeploy:
 *   NEXT_PUBLIC_DEMO_USER_ID=<printed uid>   DEMO_EMAIL   DEMO_PASSWORD
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const requireFromApp = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { createClient } = requireFromApp('@supabase/supabase-js');
let sharp = null;
try {
  sharp = requireFromApp('sharp');
} catch {
  console.warn('sharp not available — skipping thumbnail generation (grid will use on-the-fly transforms).');
}

// ---- env -------------------------------------------------------------------
function loadEnv() {
  const file = join(repoRoot, 'apps/web/.env.local');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@bewora.nl';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || `demo-${Math.abs(hashStr(DEMO_EMAIL))}-bewora`;
const BUCKET = 'archief';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (see the header).');
  process.exit(1);
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const storageKey = (uid, sha) => `archive/${uid}/${sha.slice(0, 2)}/${sha}`;
const thumbKey = (uid, id) => `archive/${uid}/thumb/${id}.webp`;

// ---- demo data -------------------------------------------------------------
const data = (name) => JSON.parse(readFileSync(join(repoRoot, 'data/demo', name), 'utf8'));
const photos = data('demo-photos.json').photos;
const documents = data('demo-documents.json').documents;
const people = data('demo-people.json').people;
const albums = data('demo-albums.json').albums;
const centroids = data('demo-places.json').centroids;
const photosDir = join(repoRoot, 'apps/web/public/demo/photos');
const docsDir = join(repoRoot, 'apps/web/public/demo/documents');

const SOURCE_LABELS = {
  apple_photos: "Apple Foto's",
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  google_photos: 'Google Photos',
  manual_upload: 'Handmatig toegevoegd',
  google_drive: 'Google Drive',
  onedrive: 'OneDrive',
  dropbox: 'Dropbox',
};

async function main() {
  console.log('→ Ensuring demo user…');
  const uid = await ensureUser();
  console.log('   demo user id:', uid);

  console.log('→ Wiping previous demo content (owner-scoped)…');
  await wipe(uid);

  // One connector account per source key that appears in the data.
  const sourceKeys = new Set();
  for (const p of photos) for (const s of p.sources) sourceKeys.add(s.key);
  for (const d of documents) sourceKeys.add(d.source);
  const accountByKey = {};
  for (const key of sourceKeys) {
    const { data: acc, error } = await admin
      .from('connector_accounts')
      .insert({
        user_id: uid,
        connector_key: key,
        display_name: SOURCE_LABELS[key] ?? key,
        status: 'connected',
        connected_at: new Date().toISOString(),
        last_successful_archive_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) throw error;
    accountByKey[key] = acc.id;
  }

  // Photos: one archive_item per photo, one archive_item_source per source.
  console.log(`→ Photos (${photos.length})…`);
  const itemIdByPhoto = {};
  for (const p of photos) {
    const bytes = readFileSync(join(photosDir, p.filename));
    const sha = sha256(bytes);
    const key = storageKey(uid, sha);
    await upload(key, bytes, 'image/jpeg');
    const { data: item, error } = await admin
      .from('archive_items')
      .insert({
        owner_id: uid,
        type: 'photo',
        original_filename: p.filename,
        mime_type: 'image/jpeg',
        file_size: bytes.length,
        checksum_sha256: sha,
        created_at_source: p.capturedAt,
        taken_at: p.capturedAt,
        archived_at: new Date().toISOString(),
        storage_provider: 'supabase',
        storage_key: key,
        status: 'archived',
        metadata_json: {
          title: p.title,
          datePrecision: p.datePrecision,
          place: p.place,
          city: p.city,
          country: p.country,
          region: p.region,
          locationSource: p.locationSource,
          tags: p.tags,
        },
        latitude: p.lat,
        longitude: p.lng,
        width: p.width,
        height: p.height,
      })
      .select('id')
      .single();
    if (error) throw error;
    itemIdByPhoto[p.id] = item.id;

    for (const s of p.sources) {
      await admin.from('archive_item_sources').insert({
        archive_item_id: item.id,
        connector_account_id: accountByKey[s.key],
        source_item_id: `${p.id}:${s.key}`,
        source_created_at: p.capturedAt,
        source_deleted_at: s.sourceDeletedAt,
      });
    }
    if (sharp) await makeThumb(uid, item.id, bytes);
  }

  // Documents: archive_items of type document.
  console.log(`→ Documents (${documents.length})…`);
  for (const d of documents) {
    const path = join(docsDir, d.placeholder);
    const bytes = existsSync(path) ? readFileSync(path) : Buffer.from(`${d.title}\n\nDemo.`, 'utf8');
    const sha = sha256(bytes);
    const key = storageKey(uid, sha);
    await upload(key, bytes, d.mimeType || 'application/pdf');
    const { data: item, error } = await admin
      .from('archive_items')
      .insert({
        owner_id: uid,
        type: 'document',
        original_filename: d.filename,
        mime_type: d.mimeType || 'application/pdf',
        file_size: bytes.length,
        checksum_sha256: sha,
        created_at_source: d.documentDate,
        taken_at: d.documentDate,
        archived_at: new Date().toISOString(),
        storage_provider: 'supabase',
        storage_key: key,
        status: 'archived',
        metadata_json: { title: d.title, category: d.category, folder: d.folder, tags: d.tags },
      })
      .select('id')
      .single();
    if (error) throw error;
    await admin.from('archive_item_sources').insert({
      archive_item_id: item.id,
      connector_account_id: accountByKey[d.source],
      source_item_id: d.id,
      source_created_at: d.documentDate,
    });
  }

  // Albums, people, places, favourites.
  console.log('→ Albums, people, places, favourites…');
  await organise(uid, itemIdByPhoto);

  const counts = await countDemo(uid);
  console.log('\n✅ Demo seeded on production:', JSON.stringify(counts));
  console.log('\nSet these in Vercel (Production) and redeploy so the demo goes live:');
  console.log(`   NEXT_PUBLIC_DEMO_USER_ID=${uid}`);
  console.log(`   DEMO_EMAIL=${DEMO_EMAIL}`);
  console.log(`   DEMO_PASSWORD=${DEMO_PASSWORD}   (only if the user was newly created this run)`);
}

async function ensureUser() {
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
  await admin.from('profiles').upsert({ id: data.user.id, first_name: 'Demo' });
  return data.user.id;
}

async function wipe(uid) {
  await admin.from('archive_items').delete().eq('owner_id', uid);
  await admin.from('archive_albums').delete().eq('owner_id', uid);
  await admin.from('archive_people').delete().eq('owner_id', uid);
  await admin.from('archive_places').delete().eq('owner_id', uid);
  await admin.from('archive_item_flags').delete().eq('owner_id', uid);
  await admin.from('connector_accounts').delete().eq('user_id', uid);
}

async function upload(key, bytes, contentType) {
  const { error } = await admin.storage.from(BUCKET).upload(key, bytes, { contentType, upsert: true });
  if (error && !/exists/i.test(error.message)) throw error;
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

async function organise(uid, itemIdByPhoto) {
  const photoById = Object.fromEntries(photos.map((p) => [p.id, p]));
  const idsFor = (pred) => photos.filter(pred).map((p) => itemIdByPhoto[p.id]).filter(Boolean);

  // Albums (user albums with ≥1 member).
  for (const a of albums) {
    const members = photos.filter((p) => p.albums.includes(a.title));
    if (!members.length) continue;
    const cover = members.find((p) => p.favorite) ?? members[0];
    const { data: album, error } = await admin
      .from('archive_albums')
      .insert({ owner_id: uid, title: a.title, cover_item_id: itemIdByPhoto[cover.id] ?? null })
      .select('id')
      .single();
    if (error) throw error;
    let pos = 0;
    for (const p of members) {
      await admin
        .from('archive_album_items')
        .insert({ album_id: album.id, archive_item_id: itemIdByPhoto[p.id], position: pos++ });
    }
  }

  // People.
  for (const person of people) {
    const members = photos.filter((p) => p.people.includes(person.name));
    if (!members.length) continue;
    const cover = members.find((p) => p.favorite) ?? members[0];
    const { data: row, error } = await admin
      .from('archive_people')
      .insert({ owner_id: uid, display_name: person.name, cover_item_id: itemIdByPhoto[cover.id] ?? null })
      .select('id')
      .single();
    if (error) throw error;
    for (const p of members) {
      await admin.from('archive_item_people').insert({ person_id: row.id, archive_item_id: itemIdByPhoto[p.id] });
    }
  }

  // Places (by region; skip "no location").
  const regions = [...new Set(photos.map((p) => p.region).filter(Boolean))];
  for (const region of regions) {
    const c = centroids[region] ?? null;
    const { data: place, error } = await admin
      .from('archive_places')
      .insert({ owner_id: uid, name: region, latitude: c?.lat ?? null, longitude: c?.lng ?? null })
      .select('id')
      .single();
    if (error) throw error;
    for (const itemId of idsFor((p) => p.region === region)) {
      await admin.from('archive_item_places').insert({ place_id: place.id, archive_item_id: itemId });
    }
  }

  // Favourites.
  for (const p of photos.filter((p) => p.favorite)) {
    await admin
      .from('archive_item_flags')
      .insert({ owner_id: uid, archive_item_id: itemIdByPhoto[p.id], favourite: true });
  }

  void photoById;
}

async function countDemo(uid) {
  const one = async (t, col = 'owner_id') =>
    (await admin.from(t).select('id', { count: 'exact', head: true }).eq(col, uid)).count ?? 0;
  return {
    items: await one('archive_items'),
    albums: await one('archive_albums'),
    people: await one('archive_people'),
    places: await one('archive_places'),
    favourites: await one('archive_item_flags'),
  };
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
