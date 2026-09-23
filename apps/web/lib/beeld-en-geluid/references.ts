import { buildSchatkamerDeepLink, secondsToTimecode, timecodeToSeconds } from './deeplink';
import { parseSchatkamerUrl } from './url-parser';

/** Row shape of archive_external_references (migration 0014). Declared locally
 * until the generated types are regenerated against the deployed table. Pure
 * module: no server/db imports so it stays unit-testable in isolation. */
export interface ReferenceRow {
  id: string;
  owner_id: string;
  provider: string;
  public_page_url: string;
  title: string;
  note: string | null;
  broadcast_note: string | null;
  fragment_start_seconds: number | null;
  fragment_end_seconds: number | null;
  rights_status: string;
  created_at: string;
}

/** A "media moment" as shown in the UI. */
export interface MediaMoment {
  id: string;
  title: string;
  note: string | null;
  broadcastNote: string | null;
  /** Human link-out to Beeld & Geluid (never an embed of protected media). */
  linkUrl: string;
  /** "17:28" or "17:28 – 18:40" when a fragment was recorded. */
  fragmentLabel: string | null;
  createdAt: string;
}

function fragmentLabel(start: number | null, end: number | null): string | null {
  if (start == null) return null;
  const from = secondsToTimecode(start);
  return end != null && end > start ? `${from} – ${secondsToTimecode(end)}` : from;
}

/** Build a display moment from a stored row. The link-out uses the plain item
 * URL: the `?start=` deep-link is only emitted when officially verified, which
 * it is not yet (deeplink default) — so we never invent a timestamp parameter. */
export function toMoment(row: ReferenceRow): MediaMoment {
  return {
    id: row.id,
    title: row.title,
    note: row.note,
    broadcastNote: row.broadcast_note,
    linkUrl: buildSchatkamerDeepLink({
      publicPageUrl: row.public_page_url,
      startSeconds: row.fragment_start_seconds ?? undefined,
    }),
    fragmentLabel: fragmentLabel(row.fragment_start_seconds, row.fragment_end_seconds),
    createdAt: row.created_at,
  };
}

export interface NewReferenceInput {
  url: string;
  title: string;
  note?: string;
  broadcastNote?: string;
  fragmentStart?: string;
  fragmentEnd?: string;
}

/** The insertable columns of a validated reference (owner/provider added later). */
export type InsertableReference = Omit<ReferenceRow, 'id' | 'owner_id' | 'created_at' | 'provider'>;

export type BuildResult =
  | { ok: true; row: InsertableReference }
  | { ok: false; error: 'invalidUrl' | 'missingTitle' | 'invalidFragment' };

/**
 * Validate + normalise a pasted reference into an insertable row (pure, so it's
 * unit-tested). The URL must be a safe, allowlisted https Schatkamer URL
 * (SSRF guard); a fragment, if given, must parse as mm:ss and end ≥ start.
 */
export function buildReference(input: NewReferenceInput): BuildResult {
  const parsed = parseSchatkamerUrl(input.url ?? '');
  if (!parsed) return { ok: false, error: 'invalidUrl' };

  const title = (input.title ?? '').trim();
  if (!title) return { ok: false, error: 'missingTitle' };

  let start: number | null = null;
  let end: number | null = null;
  if (input.fragmentStart?.trim()) {
    const s = timecodeToSeconds(input.fragmentStart);
    if (s === undefined) return { ok: false, error: 'invalidFragment' };
    start = s;
  }
  if (input.fragmentEnd?.trim()) {
    const e = timecodeToSeconds(input.fragmentEnd);
    if (e === undefined) return { ok: false, error: 'invalidFragment' };
    end = e;
  }
  if (start != null && end != null && end < start) return { ok: false, error: 'invalidFragment' };

  return {
    ok: true,
    row: {
      public_page_url: parsed.url,
      title,
      note: input.note?.trim() || null,
      broadcast_note: input.broadcastNote?.trim() || null,
      fragment_start_seconds: start,
      fragment_end_seconds: end,
      rights_status: 'link_only',
    },
  };
}
