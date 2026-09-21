import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { adminIngestPort, ensureConnectorAccount, resolveAccessToken } from './store';
import { ingestTransferItem, type TransferItem } from './ingestion';

/**
 * Meta EYI Generic Importer endpoint handler (docs/connectors/meta-eyi.md §14).
 * Meta PUSHes one item per POST with a Bearer token Bewora issued. We resolve the
 * token → owner, parse the `GenericPayload` (JSON) or `multipart/related`
 * (metadata + raw bytes), archive via the service-role ingest port (dedup /
 * idempotent), and answer with the protocol status codes. No completion webhook.
 */
export type ImportEndpoint = 'photos' | 'videos' | 'media' | 'social-posts';

function bearer(request: NextRequest): string | null {
  return request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? null;
}

function indexOf(hay: Uint8Array, needle: Uint8Array, from = 0): number {
  outer: for (let i = from; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

/** Minimal multipart/related splitter: returns each part's raw body. */
function splitMultipart(buf: Uint8Array, boundary: string): Uint8Array[] {
  const enc = new TextEncoder();
  const delim = enc.encode(`--${boundary}`);
  const crlf2 = enc.encode('\r\n\r\n');
  const parts: Uint8Array[] = [];
  let pos = indexOf(buf, delim, 0);
  while (pos !== -1) {
    let start = pos + delim.length;
    if (buf[start] === 0x2d && buf[start + 1] === 0x2d) break; // closing "--"
    if (buf[start] === 0x0d && buf[start + 1] === 0x0a) start += 2;
    const next = indexOf(buf, delim, start);
    if (next === -1) break;
    let end = next;
    if (buf[end - 2] === 0x0d && buf[end - 1] === 0x0a) end -= 2;
    const section = buf.subarray(start, end);
    const sep = indexOf(section, crlf2, 0);
    parts.push(sep === -1 ? section : section.subarray(sep + 4));
    pos = next;
  }
  return parts;
}

async function parseItem(request: NextRequest, endpoint: ImportEndpoint): Promise<TransferItem | null> {
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const meta = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!meta || typeof meta !== 'object') return null;
    // JSON path may carry base64 bytes for dev/mock file items.
    const b64 = typeof meta.bytesBase64 === 'string' ? (meta.bytesBase64 as string) : undefined;
    const bytes = b64 ? Uint8Array.from(Buffer.from(b64, 'base64')) : undefined;
    return { endpoint, meta, bytes };
  }
  if (ct.includes('multipart/')) {
    const boundary = ct.match(/boundary="?([^";]+)"?/i)?.[1];
    if (!boundary) return null;
    const buf = new Uint8Array(await request.arrayBuffer());
    const parts = splitMultipart(buf, boundary);
    let meta: Record<string, unknown> = {};
    try {
      meta = JSON.parse(new TextDecoder().decode(parts[0] ?? new Uint8Array()));
    } catch {
      meta = {};
    }
    return { endpoint, meta, bytes: parts[1] };
  }
  return null;
}

export function metaImporter(endpoint: ImportEndpoint) {
  return async function POST(request: NextRequest): Promise<NextResponse> {
    const token = bearer(request);
    if (!token) return new NextResponse('invalid_token', { status: 401 });

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json({ error: 'server_error' }, { status: 503 });
    }

    const owner = await resolveAccessToken(admin, token);
    // 401 invalid_token → Meta refreshes and retries (§D11).
    if (!owner) return NextResponse.json({ error: 'invalid_token' }, { status: 401 });

    const item = await parseItem(request, endpoint);
    if (!item) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

    // The token may not carry a specific platform; ensure/keep a connector account.
    const connectorAccountId = owner.connectorAccountId ?? (await ensureConnectorAccount(admin, owner.userId, 'facebook'));

    try {
      const outcome = await ingestTransferItem(
        adminIngestPort(admin, owner.userId),
        owner.userId,
        connectorAccountId,
        item,
      );
      if (outcome === 'failed') return NextResponse.json({ error: 'invalid_item' }, { status: 422 });
      return NextResponse.json({ status: outcome }, { status: 201 });
    } catch {
      // Transient storage/db problem → 429 so Meta backs off and retries.
      return NextResponse.json({ error: 'try_again' }, { status: 429 });
    }
  };
}
