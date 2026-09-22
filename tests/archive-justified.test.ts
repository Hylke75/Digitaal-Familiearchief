import { describe, expect, it } from 'vitest';
import { justifiedLayout } from '../apps/web/lib/archive/justified';

describe('justified grid layout', () => {
  it('scales a full row to exactly the container width', () => {
    const rows = justifiedLayout([1, 1, 1], 300, 100, 0);
    expect(rows).toHaveLength(1);
    const total = rows[0]!.reduce((s, c) => s + c.width, 0);
    expect(Math.round(total)).toBe(300);
    expect(rows[0]!.every((c) => c.height === 100)).toBe(true);
  });

  it('accounts for gaps when filling the width', () => {
    const rows = justifiedLayout([1, 1], 210, 100, 10);
    const total = rows[0]!.reduce((s, c) => s + c.width, 0) + 10; // one gap
    expect(Math.round(total)).toBe(210);
  });

  it('leaves the last row at target height (not stretched)', () => {
    const rows = justifiedLayout([1, 1, 1, 1], 300, 100, 0);
    expect(rows).toHaveLength(2);
    // last row has a single leftover image at target height, not full width
    expect(rows[1]!).toHaveLength(1);
    expect(rows[1]![0]!.height).toBe(100);
    expect(rows[1]![0]!.width).toBe(100);
  });

  it('clamps extreme aspect ratios and handles missing ones', () => {
    const rows = justifiedLayout([100, 0.01], 400, 100, 0);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.flat().every((c) => c.width > 0 && c.height > 0)).toBe(true);
  });

  it('returns nothing for a zero-width container', () => {
    expect(justifiedLayout([1, 1], 0, 100, 0)).toEqual([]);
  });
});
