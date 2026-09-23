import { describe, expect, it } from 'vitest';
import { clusterMoments, type MomentItem } from '../apps/web/lib/archive/moments';

const item = (
  iso: string | null,
  lat: number | null = null,
  lon: number | null = null,
): MomentItem => ({
  effectiveDate: iso,
  latitude: lat,
  longitude: lon,
});

describe('moment clustering', () => {
  it('keeps a burst within a few hours together', () => {
    const moments = clusterMoments([
      item('2026-07-15T12:00:00Z'),
      item('2026-07-15T13:30:00Z'),
      item('2026-07-15T14:00:00Z'),
    ]);
    expect(moments).toHaveLength(1);
    expect(moments[0]).toHaveLength(3);
  });

  it('splits when the time gap is too big', () => {
    const moments = clusterMoments([item('2026-07-15T12:00:00Z'), item('2026-07-14T12:00:00Z')]);
    expect(moments).toHaveLength(2);
  });

  it('splits on a big location jump within the time window', () => {
    const moments = clusterMoments([
      item('2026-07-15T12:00:00Z', 52.1, 4.3),
      item('2026-07-15T13:00:00Z', 43.7, 11.2),
    ]);
    expect(moments).toHaveLength(2);
  });

  it('never splits on missing coordinates', () => {
    const moments = clusterMoments([
      item('2026-07-15T12:00:00Z', 52.1, 4.3),
      item('2026-07-15T13:00:00Z', null, null),
    ]);
    expect(moments).toHaveLength(1);
  });

  it('starts a new moment for undated items', () => {
    const moments = clusterMoments([item('2026-07-15T12:00:00Z'), item(null)]);
    expect(moments).toHaveLength(2);
  });
});
