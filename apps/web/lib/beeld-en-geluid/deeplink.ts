/**
 * Schatkamer deep-link builder (docs/connectors/beeld-en-geluid.md §9). Produces
 * a link to an item, optionally at a timestamp. The timestamp parameter is only
 * emitted when it is officially verified/enabled — otherwise we fall back to the
 * plain item URL and NEVER invent a parameter. Bewora still stores the personal
 * start/end times regardless of whether the deep-link carries them.
 */
export interface DeepLinkInput {
  /** The official item/player URL. */
  publicPageUrl: string;
  streamId?: string;
  startSeconds?: number;
}

/**
 * @param timestampSupported set true only when official docs / a verified flag
 *   confirm `?start=<seconds>` is supported. Default false → plain URL.
 */
export function buildSchatkamerDeepLink(input: DeepLinkInput, timestampSupported = false): string {
  let url: URL;
  try {
    url = new URL(input.publicPageUrl);
  } catch {
    return input.publicPageUrl;
  }
  if (timestampSupported && input.startSeconds !== undefined && input.startSeconds >= 0) {
    if (input.streamId) url.searchParams.set('stream', input.streamId);
    url.searchParams.set('start', String(Math.floor(input.startSeconds)));
  }
  return url.toString();
}

/** "17:28" ⇄ seconds helpers for the fragment picker (§8). */
export function timecodeToSeconds(mmss: string): number | undefined {
  const m = mmss.trim().match(/^(?:(\d+):)?([0-5]?\d):([0-5]\d)$|^(\d+):([0-5]\d)$/);
  if (!m) return undefined;
  if (m[4] !== undefined) return Number(m[4]) * 60 + Number(m[5]); // mm:ss
  const h = m[1] ? Number(m[1]) : 0;
  return h * 3600 + Number(m[2]) * 60 + Number(m[3]); // [hh:]mm:ss
}

export function secondsToTimecode(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`;
}
