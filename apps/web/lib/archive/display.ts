/**
 * Pure display helpers (no I/O, unit-tested). Consumer-facing archive UI shows a
 * memory, not a file: strip the technical extension from titles and format a
 * video duration as mm:ss (design advice §D4, Advice A).
 */

/** Drop a trailing file extension for display (keeps names without one). */
export function stripExtension(name: string): string {
  return name.replace(/\.[a-z0-9]{2,4}$/i, '') || name;
}

/** Format a duration in milliseconds as `m:ss`. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
