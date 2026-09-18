/**
 * @dla/shared — cross-cutting types and pure utilities.
 * No runtime dependencies. Safe to import from any layer (client or server).
 */

/** Exhaustiveness helper: forces a compile error if a union is not fully handled. */
export function assertNever(value: never, message = 'Unexpected value'): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}

/** A minimal, explicit result type so failure paths are never swallowed silently. */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** Branded types keep opaque identifiers from being mixed up at compile time. */
export type Brand<T, B extends string> = T & { readonly __brand: B };
export type UserId = Brand<string, 'UserId'>;
export type ArchiveItemId = Brand<string, 'ArchiveItemId'>;
export type ConnectorAccountId = Brand<string, 'ConnectorAccountId'>;
export type JobId = Brand<string, 'JobId'>;

/** Human-readable byte size, used for consumer-facing storage figures. */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

/** Deterministic import trace id, e.g. IMP-20260918-98374 (see CLAUDE.md §49). */
export function importTraceId(date: Date, sequence: number): string {
  const yyyy = date.getUTCFullYear().toString().padStart(4, '0');
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = date.getUTCDate().toString().padStart(2, '0');
  const seq = sequence.toString().padStart(5, '0');
  return `IMP-${yyyy}${mm}${dd}-${seq}`;
}
