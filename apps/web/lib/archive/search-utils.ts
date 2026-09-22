/** Pure search helpers (no I/O) so they stay unit-testable in isolation. */

/**
 * Escape PostgREST ilike metacharacters (and the comma/parens PostgREST treats
 * specially inside filters) so a user's filename query is matched literally
 * rather than as a wildcard pattern.
 */
export function escapeLike(raw: string): string {
  return raw.replace(/[\\%_,()]/g, (m) => `\\${m}`);
}
