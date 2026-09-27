import Link from 'next/link';
import { Heart, Layers } from 'lucide-react';
import { resolveDemoMediaUrl } from '@/lib/demo/media';
import type { DemoPhoto } from '@/lib/demo/types';

/** A single photo-first tile linking to the immersive detail view. */
export function PhotoTile({ photo }: { photo: DemoPhoto }) {
  const sourceCount = photo.sources.filter((s) => !s.sourceDeletedAt).length;
  return (
    <Link
      href={`/fotos/item/${photo.id}`}
      className="rounded-card focus-visible:ring-forest bg-warm group relative block overflow-hidden focus-visible:outline-none focus-visible:ring-2"
    >
      <div className="aspect-square w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveDemoMediaUrl(photo.filename)}
          alt={photo.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        />
      </div>
      <div className="pointer-events-none absolute right-2 top-2 flex gap-1">
        {photo.favorite ? (
          <span className="rounded-full bg-black/45 p-1.5 text-white" aria-label="Favoriet">
            <Heart className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
          </span>
        ) : null}
        {sourceCount > 1 ? (
          <span
            className="text-caption flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 font-semibold text-white"
            aria-label={`${sourceCount} bronnen`}
          >
            <Layers className="h-3 w-3" aria-hidden="true" />
            {sourceCount}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

/** Photo-first responsive grid used across every photo view (§53). */
export function PhotoGrid({ photos }: { photos: DemoPhoto[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((p) => (
        <li key={p.id}>
          <PhotoTile photo={p} />
        </li>
      ))}
    </ul>
  );
}
