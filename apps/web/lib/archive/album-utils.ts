/** Pure album helpers (no I/O) so they stay unit-testable in isolation. */

/** Trim + collapse whitespace + bound an album/collection title; null if empty. */
export function normalizeTitle(raw: string, max = 120): string | null {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}
