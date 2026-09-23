/**
 * Pure moment clustering (no I/O, unit-tested). Turns a date-sorted list of
 * memories into "moments" — bursts that fall within a few hours and the same
 * rough location (design advice, Advice A "Momenten in plaats van dagen"). A
 * new moment starts when the time gap or the location jump is too big; missing
 * coordinates never force a split.
 */

export interface MomentItem {
  effectiveDate: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface MomentOptions {
  /** Max gap between consecutive items to stay in one moment (ms). */
  maxGapMs?: number;
  /** Max coordinate distance (degrees, rough) to stay in one moment. */
  maxDistanceDeg?: number;
}

const DEFAULTS: Required<MomentOptions> = {
  maxGapMs: 6 * 60 * 60 * 1000,
  maxDistanceDeg: 0.5,
};

function time(item: MomentItem): number | null {
  if (!item.effectiveDate) return null;
  const t = Date.parse(item.effectiveDate);
  return Number.isNaN(t) ? null : t;
}

function placeFar(a: MomentItem, b: MomentItem, maxDeg: number): boolean {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) {
    return false; // unknown location never splits a moment
  }
  const d = Math.hypot(a.latitude - b.latitude, a.longitude - b.longitude);
  return d > maxDeg;
}

/** Split date-sorted items into moments. Returns groups preserving input order. */
export function clusterMoments<T extends MomentItem>(items: T[], opts: MomentOptions = {}): T[][] {
  const { maxGapMs, maxDistanceDeg } = { ...DEFAULTS, ...opts };
  const moments: T[][] = [];
  let current: T[] = [];
  for (const item of items) {
    if (current.length === 0) {
      current.push(item);
      continue;
    }
    const prev = current[current.length - 1]!;
    const tp = time(prev);
    const tc = time(item);
    const gapTooBig = tp != null && tc != null && Math.abs(tp - tc) > maxGapMs;
    const undated = tp == null || tc == null;
    if (gapTooBig || undated || placeFar(prev, item, maxDistanceDeg)) {
      moments.push(current);
      current = [item];
    } else {
      current.push(item);
    }
  }
  if (current.length > 0) moments.push(current);
  return moments;
}
