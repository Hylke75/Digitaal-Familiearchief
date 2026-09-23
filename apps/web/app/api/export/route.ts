import { NextResponse, type NextRequest } from 'next/server';
import { streamZip, type ZipEntry } from '@dla/import';
import { createClient } from '@/lib/supabase/server';
import { auditLog } from '@/lib/security/audit';
import { rateLimit } from '@/lib/security/rate-limit';
import { SupabaseStorageProvider } from '@/lib/archive/supabase-storage';
import { buildManifest, exportEntryName, type ExportItem } from '@/lib/archive/export-utils';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Bound a single export so a very large archive can't run past the wall; the
// manifest flags truncation. Async, resumable exports are a later refinement.
const MAX_ITEMS = 3000;
// A byte ceiling as well: a handful of very large originals can blow the wall
// long before MAX_ITEMS. We stop adding once the cumulative original size would
// exceed this, and the manifest flags the export as truncated.
const MAX_BYTES = 8 * 1024 * 1024 * 1024; // 8 GB

const SELECT =
  'id, storage_key, original_filename, type, mime_type, file_size, checksum_sha256, taken_at, created_at_source, archived_at, latitude, longitude, width, height, camera';

type ExportRow = ExportItem & { storage_key: string };

const README = (count: number) =>
  `Bewora — jouw archief
=====================

Dit pakket bevat je volledige archief, onafhankelijk van Bewora en de
oorspronkelijke platforms.

Inhoud:
  originals/        je originele bestanden, gegroepeerd per type
                    (photos, videos, documents, …). De bestandsnamen zijn
                    genummerd zodat niets elkaar overschrijft.
  archive.json      een overzicht van alle ${count} items met titel, datum,
                    locatie, afmetingen en de SHA-256-controlesom van het
                    origineel — zodat je de inhoud later kunt verifiëren.

Je hebt niets van Bewora nodig om deze bestanden te openen.
`;

export async function GET(request: NextRequest): Promise<NextResponse | Response> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/inloggen', request.url));

  // Exports are heavy; cap how often one user can start one.
  const limited = rateLimit(`export:${user.id}`, 5, 60_000);
  if (!limited.ok) {
    return new NextResponse('Even geduld — probeer het zo opnieuw.', {
      status: 429,
      headers: { 'retry-after': String(limited.retryAfter) },
    });
  }

  // Optional `?ids=` selects a subset (bulk download of selected memories).
  const idsParam = request.nextUrl.searchParams.get('ids');
  const ids = idsParam
    ? idsParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, MAX_ITEMS)
    : null;

  let base = supabase.from('archive_items').select(SELECT);
  if (ids && ids.length > 0) base = base.in('id', ids);
  const { data } = await base
    .order('taken_at', { ascending: true, nullsFirst: false })
    .order('created_at_source', { ascending: true, nullsFirst: false })
    .order('archived_at', { ascending: true })
    .limit(MAX_ITEMS + 1);

  const rows = (data ?? []) as ExportRow[];
  let truncated = rows.length > MAX_ITEMS;
  const capped = truncated ? rows.slice(0, MAX_ITEMS) : rows;

  // Apply the byte ceiling: keep items until adding the next would exceed it.
  const items: ExportRow[] = [];
  let bytes = 0;
  for (const it of capped) {
    const size = it.file_size ?? 0;
    if (items.length > 0 && bytes + size > MAX_BYTES) {
      truncated = true;
      break;
    }
    items.push(it);
    bytes += size;
  }

  await auditLog(supabase, 'archive_export_requested', {
    items: items.length,
    truncated,
    selection: ids ? 'subset' : 'full',
  });

  const storage = new SupabaseStorageProvider(supabase);
  const manifest = buildManifest(items, new Date().toISOString(), truncated);
  const enc = new TextEncoder();

  async function* entries(): AsyncIterable<ZipEntry> {
    yield { name: 'archive.json', data: enc.encode(JSON.stringify(manifest, null, 2)) };
    yield { name: 'README.txt', data: enc.encode(README(items.length)) };
    for (let i = 0; i < items.length; i++) {
      const it = items[i]!;
      try {
        const bytes = await storage.get(it.storage_key);
        yield { name: exportEntryName(it, i), data: bytes };
      } catch {
        // A missing/unreadable original is skipped; the manifest still lists it.
      }
    }
  }

  return new Response(streamZip(entries), {
    headers: {
      'content-type': 'application/zip',
      'content-disposition': 'attachment; filename="bewora-archief.zip"',
      'cache-control': 'no-store',
    },
  });
}
