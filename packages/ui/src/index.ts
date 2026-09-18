/**
 * @dla/ui — shared, framework-agnostic UI helpers.
 * Presentational React components are added in later phases; Phase 0 keeps this
 * dependency-free so it can be imported anywhere.
 */

/** Minimal className combiner (truthy strings only). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
