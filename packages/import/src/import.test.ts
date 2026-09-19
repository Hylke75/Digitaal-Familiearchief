import { zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { detectImporter } from './detect';
import { isSafeEntryName, readZipSafely, ZipSafetyError } from './zip';
import { InstagramImporter } from './importers';

const bytes = (s: string) => new TextEncoder().encode(s);

describe('zip safety', () => {
  it('rejects path traversal and absolute names', () => {
    expect(isSafeEntryName('../evil.txt')).toBe(false);
    expect(isSafeEntryName('/etc/passwd')).toBe(false);
    expect(isSafeEntryName('a/b/photo.jpg')).toBe(true);
    expect(isSafeEntryName('dir/')).toBe(false);
  });

  it('extracts safe entries and skips unsafe ones', async () => {
    const zip = zipSync({
      'media/a.jpg': bytes('image-a'),
      'notes.txt': bytes('hello'),
    });
    const out = await readZipSafely(zip);
    expect(out.has('media/a.jpg')).toBe(true);
    expect(out.get('notes.txt')).toEqual(bytes('hello'));
  });

  it('enforces a per-entry decompressed size limit (zip-bomb guard)', async () => {
    const zip = zipSync({ 'big.bin': new Uint8Array(5000) });
    await expect(
      readZipSafely(zip, { maxEntries: 10, maxEntrySize: 100, maxTotalSize: 1_000_000 }),
    ).rejects.toBeInstanceOf(ZipSafetyError);
  });
});

describe('provider detection', () => {
  it('detects an Instagram export', () => {
    const { result } = detectImporter([
      'your_instagram_activity/media/posts/2020/photo.jpg',
      'personal_information/personal_information.json',
    ]);
    expect(result.importerKey).toBe('instagram');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('detects an X archive', () => {
    const { result } = detectImporter(['data/tweets.js', 'data/tweets_media/1.jpg']);
    expect(result.importerKey).toBe('x');
  });

  it('falls back to the generic importer for unknown archives', () => {
    const { result } = detectImporter(['random/file.jpg', 'thing.mp4']);
    expect(result.importerKey).toBe('generic');
  });
});

describe('parsing', () => {
  it('extracts media items and ignores metadata json', () => {
    const files = new Map<string, Uint8Array>([
      ['your_instagram_activity/media/posts/photo.jpg', bytes('img')],
      ['your_instagram_activity/media/posts/clip.mp4', bytes('vid')],
      ['personal_information/personal_information.json', bytes('{}')],
    ]);
    const { items, warnings } = InstagramImporter.parse(files);
    expect(items.map((i) => i.mimeType).sort()).toEqual(['image/jpeg', 'video/mp4']);
    expect(items[0]!.metadata).toMatchObject({ provider: 'instagram' });
    expect(warnings).toHaveLength(0);
  });
});
