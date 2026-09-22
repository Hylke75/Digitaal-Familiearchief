/**
 * Pure timeline helpers (no I/O) so they are unit-testable. The archive browser
 * groups memories by calendar month of their effective date, newest first, and
 * highlights "on this day" across years. Grouping keys use the ISO date's
 * year-month prefix — stable and locale-independent; the UI formats the label.
 */

export interface DatedItem {
  /** Effective date (taken → source-created → archived), ISO string or null. */
  effectiveDate: string | null;
}

export interface MonthGroup<T extends DatedItem> {
  /** `YYYY-MM`, or `unknown` when no date is available. */
  key: string;
  /** First day of that month as ISO (`YYYY-MM-01`), or null for `unknown`. */
  monthStart: string | null;
  items: T[];
}

/** `YYYY-MM` prefix of an ISO date, or `unknown`. */
export function monthKey(iso: string | null): string {
  if (!iso || iso.length < 7) return 'unknown';
  return iso.slice(0, 7);
}

/**
 * Group already-sorted items (newest first) into month buckets, preserving the
 * input order both across and within groups. Undated items collect under a
 * trailing `unknown` group.
 */
export function groupByMonth<T extends DatedItem>(items: T[]): MonthGroup<T>[] {
  const groups: MonthGroup<T>[] = [];
  const index = new Map<string, MonthGroup<T>>();
  for (const item of items) {
    const key = monthKey(item.effectiveDate);
    let group = index.get(key);
    if (!group) {
      group = { key, monthStart: key === 'unknown' ? null : `${key}-01`, items: [] };
      index.set(key, group);
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

/** True when the ISO date falls on the given month/day (1-based), any year. */
export function isOnThisDay(iso: string | null, month: number, day: number): boolean {
  if (!iso || iso.length < 10) return false;
  const m = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  return m === month && d === day;
}
