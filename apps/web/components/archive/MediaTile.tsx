import Link from 'next/link';
import { AudioLines, Download, FileText, Play, Star } from 'lucide-react';
import type { MediaCard } from '@/lib/archive/queries';
import { formatDuration, stripExtension } from '@/lib/archive/display';
import { AutoRefreshImage } from '@/components/archive/AutoRefreshImage';

/**
 * Presentational archive tile. Renderable images/posters fill the tile with no
 * text on it (design advice, Advice A) — only the favourite star, a video play
 * badge with duration, and a download-on-hover control. Non-visual items
 * (documents) fall back to a labelled file card. The whole tile links to the
 * detail view; download is layered above (never nested anchors).
 */
export function MediaTile({ item, locale: _locale }: { item: MediaCard; locale: string }) {
  const title = stripExtension(item.filename);
  const href = `/archief/${item.id}`;

  if (item.thumbUrl) {
    return (
      <div className="bg-warm group relative aspect-square overflow-hidden rounded-[4px]">
        <AutoRefreshImage
          itemId={item.id}
          src={item.thumbUrl}
          alt={title}
          className="h-full w-full object-cover duration-300 motion-safe:transition-transform motion-safe:group-hover:scale-[1.03]"
        />
        <Link href={href} className="absolute inset-0" aria-label={title} />
        {item.type === 'video' ? (
          <>
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
                <Play className="h-5 w-5" aria-hidden="true" />
              </span>
            </span>
            {item.durationMs ? (
              <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white">
                {formatDuration(item.durationMs)}
              </span>
            ) : null}
          </>
        ) : null}
        {item.favourite ? (
          <span className="text-brass absolute left-2 top-2 z-10 drop-shadow">
            <Star className="h-4 w-4 fill-current" aria-hidden="true" />
          </span>
        ) : null}
        {item.hasStory ? (
          <span
            className="pointer-events-none absolute bottom-2 left-2 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
            title="Verhaal"
          >
            <AudioLines className="h-3 w-3" aria-hidden="true" />
          </span>
        ) : null}
        <a
          href={`/archief/download/${item.id}`}
          className="text-ink focus-visible:ring-forest absolute right-2 top-2 z-10 rounded-full bg-white/85 p-2 opacity-0 shadow-sm backdrop-blur transition-opacity hover:bg-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 group-hover:opacity-100"
          aria-label={`Download ${title}`}
          title="Download"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <div className="border-border rounded-card hover:bg-warm relative flex items-center gap-3 border p-3 transition-colors">
      <span className="bg-warm text-forest inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]">
        <FileText className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-ink truncate font-semibold">{title}</p>
      </div>
      {item.favourite ? (
        <Star className="text-brass h-4 w-4 shrink-0 fill-current" aria-hidden="true" />
      ) : null}
      <Link href={href} className="absolute inset-0" aria-label={title} />
      <a
        href={`/archief/download/${item.id}`}
        className="rounded-button text-ink-soft hover:bg-warm hover:text-ink relative z-10 p-2 transition-colors"
        aria-label={`Download ${title}`}
        title="Download"
      >
        <Download className="h-5 w-5" aria-hidden="true" />
      </a>
    </div>
  );
}
