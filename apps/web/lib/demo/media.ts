import manifest from '../../../../data/demo/media-manifest.json';

const realPhotos = manifest.photos as Record<string, boolean>;

/**
 * Resolve the URL for a demo photo. Prefers a real `.jpg` when the seed found
 * one on disk; otherwise falls back to the generated `.svg` placeholder. Drop
 * real photos into apps/web/public/demo/photos and re-run `pnpm seed:demo` —
 * no code change (§45).
 */
export function resolveDemoMediaUrl(filename: string): string {
  const base = '/demo/photos/';
  if (realPhotos[filename]) return base + filename;
  return base + filename.replace(/\.jpg$/i, '.svg');
}

/** Document placeholder/real URL (always a valid PDF for the demo). */
export function resolveDemoDocUrl(placeholder: string): string {
  return '/demo/documents/' + placeholder;
}
