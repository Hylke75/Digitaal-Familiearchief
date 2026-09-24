import { NextResponse, type NextRequest } from 'next/server';
import { sha256Hex, contentStorageKey } from '@dla/archive';
import { archiveTypeFromMime } from '@dla/connectors';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';
import { resolveInvite } from '@/lib/events/guest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'archief';
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB per bijdrage
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);
const extFor = (mime: string) => (mime.split('/')[1] || 'bin').replace('quicktime', 'mov');

/**
 * Gast-upload bij een gebeurtenis. Geen account: het token bepaalt bij welke
 * gebeurtenis (en eigenaar) de foto hoort. De gast schrijft nooit rechtstreeks;
 * deze service-role-route valideert het token, begrenst tempo/grootte/type,
 * bewaart de foto onder de eigenaar (verborgen tot goedkeuring) en koppelt hem
 * als niet-goedgekeurde bijdrage. Gebruik wordt geaudit.
 */
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const ip = clientIp(request.headers);
  if (!rateLimit(`event-upload-ip:${ip}`, 30, 60_000).ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  const invite = await resolveInvite(params.token);
  if (!invite) return NextResponse.json({ error: 'invalid' }, { status: 404 });
  if (!rateLimit(`event-upload-token:${invite.inviteId}`, 60, 60_000).ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const file = form.get('file');
  const contributor = (form.get('contributor') as string | null)?.trim().slice(0, 120) || null;
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: 'not_allowed' }, { status: 415 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const checksum = sha256Hex(bytes);
  const key = contentStorageKey(invite.ownerId, checksum);
  const takenAt = invite.happenedOn ? `${invite.happenedOn}T12:00:00Z` : null;

  // Dedup on (owner, checksum): reuse an existing item, else store + insert.
  const { data: existing } = await admin
    .from('archive_items')
    .select('id')
    .eq('owner_id', invite.ownerId)
    .eq('checksum_sha256', checksum)
    .maybeSingle();

  let itemId = existing?.id;
  if (!itemId) {
    const up = await admin.storage
      .from(BUCKET)
      .upload(key, bytes, { contentType: file.type, upsert: true });
    if (up.error) return NextResponse.json({ error: 'upload_failed' }, { status: 502 });
    const { data: inserted, error } = await admin
      .from('archive_items')
      .insert({
        owner_id: invite.ownerId,
        type: archiveTypeFromMime(file.type),
        original_filename: file.name || `bijdrage.${extFor(file.type)}`,
        mime_type: file.type,
        file_size: bytes.byteLength,
        checksum_sha256: checksum,
        storage_provider: 'supabase',
        storage_key: key,
        taken_at: takenAt,
        archived_at: new Date().toISOString(),
        status: 'archived',
      })
      .select('id')
      .single();
    if (error || !inserted) return NextResponse.json({ error: 'store_failed' }, { status: 500 });
    itemId = inserted.id;
  }

  // Hidden until the owner approves — kept out of the timeline and tallies.
  await admin
    .from('archive_item_flags')
    .upsert([{ owner_id: invite.ownerId, archive_item_id: itemId, hidden: true }], {
      onConflict: 'owner_id,archive_item_id',
    });
  await admin.from('archive_event_items').upsert(
    {
      event_id: invite.eventId,
      archive_item_id: itemId,
      contributed_by_label: contributor,
      approved: false,
    },
    { onConflict: 'event_id,archive_item_id', ignoreDuplicates: true },
  );
  await admin
    .from('archive_event_invites')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invite.inviteId);
  await admin.from('security_audit_events').insert({
    user_id: invite.ownerId,
    type: 'event_invite_used',
    context_json: { eventId: invite.eventId, contributor } as never,
  });

  return NextResponse.json({ ok: true });
}
