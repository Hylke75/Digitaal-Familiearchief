/**
 * Minimal in-memory fixed-window rate limiter (§42). Serverless instances don't
 * share memory, so this is a per-instance backstop against bursts and accidental
 * loops — not a global quota. A shared store (e.g. Upstash) is the later upgrade;
 * the call sites stay the same. No external dependency, no I/O.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Opportunistic sweep so the map can't grow without bound on a long-lived
// instance. Runs at most once per window per call, O(expired entries).
let lastSweep = 0;
function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets (for a Retry-After header). */
  retryAfter: number;
}

/**
 * Record a hit for `key` and report whether it's within `limit` per `windowMs`.
 * `key` should scope the thing being protected (e.g. `export:<userId>` or
 * `oauth:<ip>`).
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

/** Best-effort client IP from the standard proxy headers (Vercel sets these). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return headers.get('x-real-ip')?.trim() || 'unknown';
}
