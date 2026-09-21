import { describe, expect, it } from 'vitest';
import { parseSchatkamerUrl } from '../apps/web/lib/beeld-en-geluid/url-parser';
import { canEmbed } from '../apps/web/lib/beeld-en-geluid/types';
import {
  buildSchatkamerDeepLink,
  timecodeToSeconds,
  secondsToTimecode,
} from '../apps/web/lib/beeld-en-geluid/deeplink';
import {
  NisvMediaCatalogClient,
  adaptBindings,
  rightsFrom,
  type Fetcher,
} from '../apps/web/lib/beeld-en-geluid/catalog-client';

describe('Schatkamer URL parser (SSRF-safe)', () => {
  it('accepts an allowlisted https URL and extracts stream + start', () => {
    const p = parseSchatkamerUrl(
      'https://schatkamer.beeldengeluid.nl/item/abc?stream=xyz&start=1048',
    );
    expect(p).not.toBeNull();
    expect(p!.host).toBe('schatkamer.beeldengeluid.nl');
    expect(p!.streamId).toBe('xyz');
    expect(p!.startSeconds).toBe(1048);
    expect(p!.itemId).toBe('abc');
  });

  it('rejects other hosts (SSRF guard), non-https and garbage', () => {
    expect(parseSchatkamerUrl('https://evil.example/schatkamer.beeldengeluid.nl')).toBeNull();
    expect(parseSchatkamerUrl('http://schatkamer.beeldengeluid.nl/x')).toBeNull();
    expect(parseSchatkamerUrl('not a url')).toBeNull();
    expect(parseSchatkamerUrl('https://beeldengeluid.nl.evil.com/x')).toBeNull();
  });

  it('ignores a non-numeric start param', () => {
    const p = parseSchatkamerUrl('https://schatkamer.beeldengeluid.nl/i?start=abc');
    expect(p!.startSeconds).toBeUndefined();
  });
});

describe('rights / embedding', () => {
  it('embeds only when embeddable + public-domain/embed-allowed', () => {
    expect(canEmbed({ embeddable: true, rightsStatus: 'public_domain', publicDomain: true })).toBe(
      true,
    );
    expect(canEmbed({ embeddable: true, rightsStatus: 'embed_allowed', publicDomain: false })).toBe(
      true,
    );
    expect(canEmbed({ embeddable: true, rightsStatus: 'link_only', publicDomain: false })).toBe(
      false,
    );
    expect(canEmbed({ embeddable: false, rightsStatus: 'public_domain', publicDomain: true })).toBe(
      false,
    );
  });
});

describe('deep-link builder (no invented params by default)', () => {
  const base = 'https://schatkamer.beeldengeluid.nl/item/abc';
  it('falls back to the plain URL unless timestamp is verified-supported', () => {
    expect(buildSchatkamerDeepLink({ publicPageUrl: base, startSeconds: 1048 })).toBe(base);
  });
  it('adds start (+stream) only when supported', () => {
    const url = buildSchatkamerDeepLink(
      { publicPageUrl: base, streamId: 'xyz', startSeconds: 1048 },
      true,
    );
    expect(url).toContain('start=1048');
    expect(url).toContain('stream=xyz');
  });
  it('returns the input on an invalid URL', () => {
    expect(buildSchatkamerDeepLink({ publicPageUrl: 'nope', startSeconds: 5 }, true)).toBe('nope');
  });
});

describe('timecode helpers', () => {
  it('parses mm:ss and hh:mm:ss and round-trips', () => {
    expect(timecodeToSeconds('17:28')).toBe(1048);
    expect(timecodeToSeconds('1:00:00')).toBe(3600);
    expect(timecodeToSeconds('bad')).toBeUndefined();
    expect(secondsToTimecode(1048)).toBe('17:28');
    expect(secondsToTimecode(3600)).toBe('1:00:00');
  });
});

describe('NISV Media Catalog client', () => {
  it('maps rights values to Bewora rights states', () => {
    expect(rightsFrom('https://creativecommons.org/publicdomain/mark/1.0/').publicDomain).toBe(
      true,
    );
    expect(rightsFrom('http://rightsstatements.org/vocab/InC/1.0/').rightsStatus).toBe('link_only');
    expect(rightsFrom('https://creativecommons.org/licenses/by-sa/3.0/').rightsStatus).toBe(
      'open_license',
    );
    expect(rightsFrom(undefined).rightsStatus).toBe('rights_unknown');
  });

  it('adapts SPARQL bindings and skips incomplete rows', () => {
    const items = adaptBindings([
      {
        s: { type: 'uri', value: 'http://data.beeldengeluid.nl/id/program/123' },
        title: { type: 'literal', value: 'Kunstblik' },
        date: { type: 'literal', value: '2000-11-12' },
        publisher: { type: 'literal', value: 'AVRO' },
        rights: { type: 'uri', value: 'http://rightsstatements.org/vocab/InC/1.0/' },
      },
      { title: { type: 'literal', value: 'geen uri' } }, // skipped
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: 'Kunstblik',
      broadcaster: 'AVRO',
      rightsStatus: 'link_only',
    });
    expect(items[0]!.publicPageUrl).toContain('data.beeldengeluid.nl');
  });

  it('searches via the endpoint (mock fetch) and shortcuts sub-3-char queries', async () => {
    let calledUrl = '';
    const fetchImpl: Fetcher = async (url) => {
      calledUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          results: {
            bindings: [
              {
                s: { type: 'uri', value: 'http://data.beeldengeluid.nl/id/program/9' },
                title: { type: 'literal', value: 'Journaal' },
              },
            ],
          },
        }),
      };
    };
    const client = new NisvMediaCatalogClient(fetchImpl);
    expect(await client.search('ab')).toEqual([]); // too short → no request
    const out = await client.search('journaal');
    expect(calledUrl).toContain('cat.apis.beeldengeluid.nl/sparql');
    expect(out[0]!.title).toBe('Journaal');
  });
});
