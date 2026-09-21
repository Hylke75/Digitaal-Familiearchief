import { describe, expect, it } from 'vitest';
import { buildMetaEyiDeepLink } from '../apps/web/lib/meta-eyi/deeplink';
import { requestedSections } from '../apps/web/lib/meta-eyi/categories';
import {
  generateToken,
  hashToken,
  verifyToken,
  isExpired,
  expiryFrom,
  redirectUriMatches,
} from '../apps/web/lib/meta-eyi/tokens';
import { adaptMediaItem, adaptSocialPost } from '../apps/web/lib/meta-eyi/adapter';
import { ingestTransferItem, type MetaIngestPort } from '../apps/web/lib/meta-eyi/ingestion';
import {
  mockInitialTransfer,
  mockRecurringTransfer,
  mockMalformedItem,
} from '../apps/web/lib/meta-eyi/mock-sender';

describe('deep-link builder', () => {
  it('emits only verified params with full history + daily 3y recurring', () => {
    const url = buildMetaEyiDeepLink({
      platform: 'instagram',
      importService: 'Bewora',
      redirectUri: 'https://bewora.nl/koppelen/meta/klaar',
    });
    expect(url).toContain('accountscenter.instagram.com/info_and_permissions/dyi');
    expect(url).toContain('source=external');
    expect(url).toContain('account_type=1');
    expect(url).toContain('import_service=Bewora');
    expect(url).toContain('date_range=ALL_TIME');
    expect(url).toContain('schedule_frequency=ONCE_A_DAY_FOR_THREE_YEARS');
    expect(url).toContain('sections[0]=');
    expect(url).toContain(encodeURIComponent('https://bewora.nl/koppelen/meta/klaar'));
    // no invented weekly value
    expect(url).not.toContain('WEEK');
  });

  it('Facebook uses account_type 0', () => {
    expect(buildMetaEyiDeepLink({ platform: 'facebook', importService: 'Bewora' })).toContain(
      'account_type=0',
    );
  });
});

describe('data minimisation', () => {
  it('excludes sensitive (private message) categories by default', () => {
    expect(requestedSections('facebook')).not.toContain('MESSENGER_V2');
    expect(requestedSections('instagram')).not.toContain('IG_MESSAGES');
    expect(requestedSections('instagram')).toContain('IG_YOUR_ACTIVITY');
  });
});

describe('destination-oauth tokens', () => {
  it('generates unique tokens and verifies via hash only', () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1).not.toBe(t2);
    const h = hashToken(t1);
    expect(h).not.toContain(t1); // stored hash never contains the raw token
    expect(verifyToken(t1, h)).toBe(true);
    expect(verifyToken(t2, h)).toBe(false);
  });

  it('expiry + exact redirect matching', () => {
    expect(isExpired(expiryFrom(-1000))).toBe(true);
    expect(isExpired(expiryFrom(60_000))).toBe(false);
    const allowed = ['https://meta.example/cb'];
    expect(redirectUriMatches('https://meta.example/cb', allowed)).toBe(true);
    expect(redirectUriMatches('https://meta.example/cb/evil', allowed)).toBe(false);
  });
});

describe('adapter', () => {
  it('maps a photo payload to a Bewora photo item', () => {
    const a = adaptMediaItem(
      {
        payload: {
          dataId: 'ig-1',
          name: 'IMG.jpg',
          mimeType: 'image/jpeg',
          creationTime: 1600000000,
        },
      },
      { filename: 'x', mimeType: 'image/jpeg', sourceItemId: '' },
    );
    expect(a).toMatchObject({ type: 'photo', sourceItemId: 'ig-1', filename: 'IMG.jpg' });
    expect(a.createdAtSource).toBeTruthy();
  });
  it('adapts a social post', () => {
    const a = adaptSocialPost({
      payload: { activity: { id: 'p1', type: 'NOTE', published: 1600000000 } },
    });
    expect(a.type).toBe('post');
    expect(a.sourceItemId).toBe('p1');
  });
});

function fakePort() {
  const seen = new Set<string>();
  const stored: string[] = [];
  const port: MetaIngestPort = {
    putBytes: async (key) => {
      stored.push(key);
    },
    ingest: async (input) => {
      const deduped = seen.has(input.checksumSha256);
      seen.add(input.checksumSha256);
      return { deduped };
    },
  };
  return { port, stored };
}

describe('ingestion idempotency (§17)', () => {
  it('archives an initial transfer, then dedups a recurring full export', async () => {
    const { port } = fakePort();
    const count = (arr: Awaited<ReturnType<typeof tally>>) => arr;
    async function tally(
      items: {
        endpoint: 'photos' | 'videos' | 'social-posts';
        meta: Record<string, unknown>;
        bytes?: Uint8Array;
      }[],
    ) {
      let nw = 0;
      let dup = 0;
      let fail = 0;
      for (const it of items) {
        const r = await ingestTransferItem(port, 'u1', 'acc1', it);
        if (r === 'new') nw++;
        else if (r === 'duplicate') dup++;
        else fail++;
      }
      return { nw, dup, fail };
    }

    const initial = await tally(mockInitialTransfer('instagram', 10).items);
    expect(count(initial)).toEqual({ nw: 12, dup: 0, fail: 0 }); // 10 photos + 2 posts

    const recurring = await tally(mockRecurringTransfer('instagram', 10, 10).items);
    expect(recurring).toEqual({ nw: 10, dup: 10, fail: 0 }); // 10 new, 10 already archived
  });

  it('rejects a malformed item safely', async () => {
    const { port } = fakePort();
    expect(await ingestTransferItem(port, 'u1', 'acc1', mockMalformedItem())).toBe('failed');
  });
});
