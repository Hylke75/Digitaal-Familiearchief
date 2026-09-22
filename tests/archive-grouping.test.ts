import { describe, expect, it } from 'vitest';
import { groupByMonth, isOnThisDay, monthKey } from '../apps/web/lib/archive/grouping';

describe('archive timeline grouping', () => {
  it('derives the year-month key or unknown', () => {
    expect(monthKey('2024-06-15T12:00:00Z')).toBe('2024-06');
    expect(monthKey(null)).toBe('unknown');
    expect(monthKey('bad')).toBe('unknown');
  });

  it('groups sorted items into months, preserving order, undated last', () => {
    const items = [
      { effectiveDate: '2024-06-20T10:00:00Z', id: 'a' },
      { effectiveDate: '2024-06-01T10:00:00Z', id: 'b' },
      { effectiveDate: '2024-05-30T10:00:00Z', id: 'c' },
      { effectiveDate: null, id: 'd' },
    ];
    const groups = groupByMonth(items);
    expect(groups.map((g) => g.key)).toEqual(['2024-06', '2024-05', 'unknown']);
    expect(groups[0]!.items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(groups[0]!.monthStart).toBe('2024-06-01');
    expect(groups[2]!.monthStart).toBeNull();
  });

  it('matches on-this-day across years', () => {
    expect(isOnThisDay('2019-09-22T08:00:00Z', 9, 22)).toBe(true);
    expect(isOnThisDay('2019-09-23T08:00:00Z', 9, 22)).toBe(false);
    expect(isOnThisDay(null, 9, 22)).toBe(false);
  });
});
