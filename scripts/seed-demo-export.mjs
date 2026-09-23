#!/usr/bin/env node
/**
 * Seed the demo account from a real export folder (default ~/Desktop/
 * bewora-demo-export) — 90 photos + 24 documents with rich metadata (dates,
 * GPS, albums, people, sources, favourites). Runs entirely as the demo user via
 * the anon key + RLS (no service-role key): uploads originals to the owner
 * storage path and records items through the archive_ingest_item RPC. Each item
 * is linked to a connector account named after its source (Apple Foto's,
 * Instagram, Google Drive, …) so the demo's Bronnen page looks realistic.
 *
 * Env (apps/web/.env.local): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * EXPORT_DIR overrides the folder. DEMO_EMAIL/DEMO_PASSWORD optional.
 */
import { readFileSync, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const requireFromApp = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { createClient } = requireFromApp('@supabase/supabase-js');

// unpdf is ESM-only — resolve its path from the app, then dynamic-import it.
const { extractText, getDocumentProxy } = await import(requireFromApp.resolve('unpdf'));
async function extractPdfText(bytes) {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: true });
    return String(text ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40000);
  } catch {
    return '';
  }
}

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
const EXPORT_DIR = process.env.EXPORT_DIR || join(homedir(), 'Desktop', 'bewora-demo-export');
const BUCKET = 'archief';
if (!URL_ || !ANON) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}
if (!existsSync(EXPORT_DIR)) {
  console.error('Export folder not found:', EXPORT_DIR);
  process.exit(1);
}

const supabase = createClient(URL_, ANON, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const storageKey = (uid, sha) => `archive/${uid}/${sha.slice(0, 2)}/${sha}`;
const now = new Date();
const iso = (d) => d.toISOString();

// Split a semicolon list into trimmed, non-empty values.
const list = (s) =>
  s
    ? s
        .split(';')
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

// Map a human source name to a connector_key slug (display keeps the name).
function sourceKey(name) {
  return (
    {
      "Apple Foto's": 'apple_photos',
      'Google Photos': 'google_photos',
      Instagram: 'instagram',
      Facebook: 'facebook',
      WhatsApp: 'whatsapp',
      'Handmatig toegevoegd': 'manual',
      'Google Drive': 'google_drive',
      OneDrive: 'onedrive',
      Dropbox: 'dropbox',
    }[name] || name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
  );
}

function parseCsv(path) {
  const lines = readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.length);
  const header = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    const row = {};
    header.forEach((h, i) => (row[h] = (cells[i] ?? '').trim()));
    return row;
  });
}

async function ingest(accountId, uid, item) {
  const sha = sha256(item.bytes);
  const key = storageKey(uid, sha);
  const up = await supabase.storage
    .from(BUCKET)
    .upload(key, item.bytes, { contentType: item.mime, upsert: true });
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
      camera: item.camera ?? null,
      // Document classification (retained; drives the life-area view).
      gebied: item.gebied ?? null,
      afzender: item.afzender ?? null,
      soort: item.soort ?? null,
      documentDate: item.documentDate ?? null,
      expiresAt: item.expiresAt ?? null,
      labels: item.labels ?? null,
      text: item.text ?? null,
    },
  });
  if (error) throw error;
  return data.item_id;
}

async function main() {
  const { error: signErr } = await supabase.auth.signUp({ email: EMAIL, password: PASSWORD });
  if (signErr && !/already registered|already exists/i.test(signErr.message)) {
    console.error('signUp:', signErr.message);
  }
  const { data: session, error: inErr } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (inErr || !session?.user) {
    console.error('Cannot sign in:', inErr?.message);
    process.exit(2);
  }
  const uid = session.user.id;
  console.log('demo user id:', uid);

  // Reset the organisational rows (RLS allows owner delete on these). NOTE:
  // archive_items has NO delete policy for authenticated (writes go via the
  // RPC), so items can't be wiped from here — re-runs of the SAME export are
  // idempotent via checksum dedup, but to REPLACE the content first delete the
  // demo user's archive_items server-side (service role / SQL).
  console.log('→ resetting collections…');
  await supabase.from('archive_albums').delete().eq('owner_id', uid);
  await supabase.from('archive_people').delete().eq('owner_id', uid);
  await supabase.from('archive_places').delete().eq('owner_id', uid);
  await supabase.from('connector_accounts').delete().eq('user_id', uid);

  const photos = parseCsv(join(EXPORT_DIR, 'foto-metadata.csv'));
  const docs = parseCsv(join(EXPORT_DIR, 'document-metadata.csv'));

  // Connector accounts for every distinct source.
  const sources = new Set();
  photos.forEach((p) => p.primaire_bron && sources.add(p.primaire_bron));
  docs.forEach((d) => d.bron && sources.add(d.bron));
  const accountByName = new Map();
  for (const name of sources) {
    const { data, error } = await supabase
      .from('connector_accounts')
      .insert({
        user_id: uid,
        connector_key: sourceKey(name),
        display_name: name,
        status: 'connected',
        connected_at: iso(now),
        last_successful_archive_at: iso(now),
      })
      .select('id')
      .single();
    if (error) throw error;
    accountByName.set(name, data.id);
  }
  console.log(`→ ${accountByName.size} sources`);

  // Photos
  console.log(`→ ${photos.length} photos…`);
  const albumMembers = new Map(); // title -> [itemId]
  const peopleMembers = new Map(); // name -> [itemId]
  const placeInfo = new Map(); // place -> { lat, lon, items: [] }
  const favourites = [];
  for (const p of photos) {
    const bytes = await readFile(join(EXPORT_DIR, 'fotos', p.bestandsnaam));
    const lat = p.lat ? Number(p.lat) : null;
    const lon = p.lng ? Number(p.lng) : null;
    const id = await ingest(accountByName.get(p.primaire_bron), uid, {
      bytes,
      type: 'photo',
      filename: p.titel || p.bestandsnaam,
      mime: 'image/jpeg',
      takenAt: p.gemaakt_op || null,
      width: p.breedte ? Number(p.breedte) : null,
      height: p.hoogte ? Number(p.hoogte) : null,
      lat,
      lon,
    });
    for (const a of list(p.albums))
      (albumMembers.get(a) ?? albumMembers.set(a, []).get(a)).push(id);
    for (const person of list(p.personen))
      (peopleMembers.get(person) ?? peopleMembers.set(person, []).get(person)).push(id);
    if (p.plaats) {
      const info = placeInfo.get(p.plaats) ?? { lat, lon, items: [] };
      if (info.lat == null && lat != null) {
        info.lat = lat;
        info.lon = lon;
      }
      info.items.push(id);
      placeInfo.set(p.plaats, info);
    }
    if (p.favoriet && p.favoriet.toLowerCase() === 'ja') favourites.push(id);
  }

  // Documents — ordered by life area (categorie), with sender + document date.
  console.log(`→ ${docs.length} documents…`);
  const soonDay = (n) => {
    const d = new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  };
  let verzekIdx = 0;
  for (const d of docs) {
    const bytes = await readFile(join(EXPORT_DIR, 'documenten', d.bestandsnaam));
    const docDate = d.documentdatum ? `${d.documentdatum}T09:00:00Z` : null;
    // Give expiry-bearing categories a demo expiry date: one already expired,
    // one expiring soon, the rest comfortably in the future.
    let expiresAt = null;
    if (['Verzekeringen', 'Voertuigen'].includes(d.categorie)) {
      expiresAt = verzekIdx === 0 ? soonDay(-20) : verzekIdx === 1 ? soonDay(12) : soonDay(400);
      verzekIdx++;
    }
    const soort = (d.labels || '').split(/[;,]/)[0]?.trim() || null;
    const text = await extractPdfText(bytes);
    await ingest(accountByName.get(d.bron), uid, {
      bytes,
      type: 'document',
      filename: d.titel || d.bestandsnaam,
      mime: 'application/pdf',
      takenAt: docDate,
      gebied: d.categorie || null,
      afzender: d.bron || null,
      soort,
      documentDate: docDate,
      expiresAt,
      labels: d.labels || null,
      text,
    });
  }

  // Albums / people / places / favourites
  console.log('→ albums, people, places, favourites…');
  for (const [title, items] of albumMembers) {
    const { data: al } = await supabase
      .from('archive_albums')
      .insert({ owner_id: uid, title })
      .select('id')
      .single();
    let pos = 0;
    for (const itemId of items)
      await supabase
        .from('archive_album_items')
        .insert({ album_id: al.id, archive_item_id: itemId, position: pos++ });
  }
  for (const [name, items] of peopleMembers) {
    const { data: pr } = await supabase
      .from('archive_people')
      .insert({ owner_id: uid, display_name: name })
      .select('id')
      .single();
    for (const itemId of items)
      await supabase
        .from('archive_item_people')
        .insert({ person_id: pr.id, archive_item_id: itemId });
  }
  for (const [name, info] of placeInfo) {
    const { data: pl } = await supabase
      .from('archive_places')
      .insert({ owner_id: uid, name, latitude: info.lat, longitude: info.lon })
      .select('id')
      .single();
    for (const itemId of info.items)
      await supabase
        .from('archive_item_places')
        .insert({ place_id: pl.id, archive_item_id: itemId });
  }
  for (const itemId of favourites)
    await supabase
      .from('archive_item_flags')
      .insert({ owner_id: uid, archive_item_id: itemId, favourite: true });

  console.log(
    `\n✅ Seeded: ${photos.length} photos, ${docs.length} docs, ${albumMembers.size} albums, ` +
      `${peopleMembers.size} people, ${placeInfo.size} places, ${favourites.length} favourites, ` +
      `${accountByName.size} sources.`,
  );
  console.log(`   NEXT_PUBLIC_DEMO_USER_ID=${uid}`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
