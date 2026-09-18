import { describe, expect, it } from 'vitest';
import { formatBytes, importTraceId, ok, err } from './index';

describe('@dla/shared', () => {
  it('formats bytes into human units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024 * 1.5)).toBe('1.5 MB');
  });

  it('builds a deterministic import trace id', () => {
    const d = new Date(Date.UTC(2026, 8, 18));
    expect(importTraceId(d, 98374)).toBe('IMP-20260918-98374');
  });

  it('models results explicitly', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(err('bad')).toEqual({ ok: false, error: 'bad' });
  });
});
