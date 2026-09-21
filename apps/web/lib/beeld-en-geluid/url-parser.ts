/**
 * Schatkamer URL parser (docs/connectors/beeld-en-geluid.md §10, §34). Validates
 * a user-pasted URL and extracts only safe identifiers. SSRF guard: the host
 * MUST be an allowlisted Beeld & Geluid domain and the scheme MUST be https —
 * Bewora never fetches an arbitrary user-supplied URL server-side.
 */
const ALLOWED_HOSTS = ['schatkamer.beeldengeluid.nl'];

export interface ParsedSchatkamerUrl {
  url: string;
  host: string;
  /** Best-effort identifiers extracted from the path/query (may be undefined). */
  itemId?: string;
  streamId?: string;
  startSeconds?: number;
}

/** Add extra official B&G hosts here only when documented (§34). */
export function isAllowedBeeldEnGeluidHost(host: string): boolean {
  return ALLOWED_HOSTS.includes(host.toLowerCase());
}

/** Parse a pasted Schatkamer URL, or return null when it is not a safe,
 * allowlisted https Beeld & Geluid URL. */
export function parseSchatkamerUrl(input: string): ParsedSchatkamerUrl | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  if (!isAllowedBeeldEnGeluidHost(u.hostname)) return null;

  const streamId = u.searchParams.get('stream') ?? undefined;
  const startRaw = u.searchParams.get('start');
  const startSeconds = startRaw && /^\d+$/.test(startRaw) ? Number(startRaw) : undefined;

  // Last non-empty path segment is a reasonable item-id candidate (kept as a
  // hint only — the record is authoritatively resolved via the official API).
  const segments = u.pathname.split('/').filter(Boolean);
  const itemId = segments.length ? segments[segments.length - 1] : undefined;

  return { url: u.toString(), host: u.hostname, itemId, streamId, startSeconds };
}
