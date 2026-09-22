import Link from 'next/link';
import { Download, FileText, Play, Star } from 'lucide-react';
import { formatBytes } from '@dla/shared';
import type { MediaCard } from '@/lib/archive/queries';

/**
 * Presentational archive tile. Renderable images show a thumbnail; other types
 * (HEIC, video, documents) show a file card. The whole tile links to the detail
 * view; download is a separate control layered above (never nested anchors).
 * Shared by the server timeline and the client infinite-scroll grid.
 */
export function MediaTile({ item, locale }: { item: MediaCard; locale: string }) {
  const date = item.effectiveDate
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(item.effectiveDate))
    : null;
  const meta = [date, formatBytes(item.fileSize)].filter(Boolean).join(' · ');
  const href = `/archief/${item.id}`;

  if (item.thumbUrl) {
    return (
      <div className="group relative">
        <div className="bg-warm rounded-card relative aspect-square overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbUrl}
            alt={item.filename}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <Link href={href} className="absolute inset-0" aria-label={item.filename} />
          {item.type === 'video' ? (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
                <Play className="h-5 w-5" aria-hidden="true" />
              </span>
            </span>
          ) : null}
          {item.favourite ? (
            <span className="text-brass absolute left-2 top-2 z-10 drop-shadow">
              <Star className="h-4 w-4 fill-current" aria-hidden="true" />
            </span>
          ) : null}
          <a
            href={`/archief/download/${item.id}`}
            className="text-ink absolute right-2 top-2 z-10 rounded-full bg-white/85 p-2 opacity-0 shadow-sm backdrop-blur transition-opacity hover:bg-white focus:opacity-100 group-hover:opacity-100"
            aria-label={`Download ${item.filename}`}
            title="Download"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
        <p className="text-ink text-small mt-1 truncate font-medium">{item.filename}</p>
        <p className="text-small text-ink-soft">{meta}</p>
      </div>
    );
  }

  return (
    <div className="border-border rounded-card hover:bg-warm relative flex items-center gap-3 border p-3 transition-colors">
      <span className="bg-warm text-forest inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]">
        <FileText className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-ink truncate font-semibold">{item.filename}</p>
        <p className="text-small text-ink-soft">{meta}</p>
      </div>
      {item.favourite ? (
        <Star className="text-brass h-4 w-4 shrink-0 fill-current" aria-hidden="true" />
      ) : null}
      <Link href={href} className="absolute inset-0" aria-label={item.filename} />
      <a
        href={`/archief/download/${item.id}`}
        className="rounded-button text-ink-soft hover:bg-warm hover:text-ink relative z-10 p-2 transition-colors"
        aria-label={`Download ${item.filename}`}
        title="Download"
      >
        <Download className="h-5 w-5" aria-hidden="true" />
      </a>
    </div>
  );
}
