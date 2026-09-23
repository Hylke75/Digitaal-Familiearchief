import { describe, expect, it } from 'vitest';
import {
  buildReference,
  toMoment,
  type ReferenceRow,
} from '../apps/web/lib/beeld-en-geluid/references';

const VALID = 'https://schatkamer.beeldengeluid.nl/item/abc';

describe('buildReference (link-only media moment)', () => {
  it('accepts a valid Schatkamer URL + title', () => {
    const r = buildReference({ url: VALID, title: 'Opa in het Journaal' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.row.public_page_url).toBe(VALID);
      expect(r.row.title).toBe('Opa in het Journaal');
      expect(r.row.rights_status).toBe('link_only');
    }
  });

  it('rejects a non-Schatkamer / non-https URL (SSRF guard)', () => {
    expect(buildReference({ url: 'https://evil.example/x', title: 'x' })).toMatchObject({
      ok: false,
      error: 'invalidUrl',
    });
    expect(
      buildReference({ url: 'http://schatkamer.beeldengeluid.nl/x', title: 'x' }),
    ).toMatchObject({ ok: false, error: 'invalidUrl' });
  });

  it('requires a title', () => {
    expect(buildReference({ url: VALID, title: '   ' })).toMatchObject({
      ok: false,
      error: 'missingTitle',
    });
  });

  it('parses an mm:ss fragment and enforces end ≥ start', () => {
    const ok = buildReference({
      url: VALID,
      title: 't',
      fragmentStart: '17:28',
      fragmentEnd: '18:40',
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.row.fragment_start_seconds).toBe(17 * 60 + 28);
      expect(ok.row.fragment_end_seconds).toBe(18 * 60 + 40);
    }
    expect(
      buildReference({ url: VALID, title: 't', fragmentStart: '18:40', fragmentEnd: '17:28' }),
    ).toMatchObject({ ok: false, error: 'invalidFragment' });
    expect(buildReference({ url: VALID, title: 't', fragmentStart: 'nonsense' })).toMatchObject({
      ok: false,
      error: 'invalidFragment',
    });
  });
});

describe('toMoment', () => {
  const base: ReferenceRow = {
    id: 'r1',
    owner_id: 'u1',
    provider: 'beeld_en_geluid',
    public_page_url: VALID,
    title: 'Titel',
    note: 'mijn herinnering',
    broadcast_note: 'najaar 1998',
    fragment_start_seconds: 1048,
    fragment_end_seconds: 1120,
    rights_status: 'link_only',
    created_at: '2026-01-02T00:00:00Z',
  };

  it('builds a display moment with a fragment label and a plain link-out', () => {
    const m = toMoment(base);
    expect(m.fragmentLabel).toBe('17:28 – 18:40');
    // No invented ?start= param: the deep-link stays the plain item URL until the
    // timestamp parameter is officially verified.
    expect(m.linkUrl).toBe(VALID);
    expect(m.linkUrl).not.toContain('start=');
  });

  it('omits the fragment label when no start is stored', () => {
    expect(toMoment({ ...base, fragment_start_seconds: null }).fragmentLabel).toBeNull();
  });
});
