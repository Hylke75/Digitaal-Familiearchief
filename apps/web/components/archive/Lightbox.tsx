'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Download, Info, X } from 'lucide-react';
import type { MediaCard } from '@/lib/archive/queries';
import { stripExtension } from '@/lib/archive/display';

/**
 * Full-screen viewer over the grid (design advice, Advice A "lichtbak"): the
 * original media, arrow-key/swipe prev-next, Escape to close, plus quick
 * download and a link to the full detail. The main media loads the original via
 * the signed download route so it's crisp, not the 600px tile.
 */
export function Lightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: MediaCard[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const t = useTranslations('archive');
  const labels = {
    download: t('download'),
    details: t('details'),
    close: t('close'),
    prev: t('prev'),
    next: t('next'),
  };
  const item = items[index];
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => {
      const next = index + delta;
      if (next >= 0 && next < items.length) onIndex(next);
    },
    [index, items.length, onIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  if (!item) return null;
  const src = `/archief/download/${item.id}`;
  const title = stripExtension(item.filename);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between gap-3 p-3 text-white">
        <div className="min-w-0">
          <p className="truncate font-medium">{title}</p>
          {item.effectiveDate ? (
            <p className="text-small text-white/70">
              {new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long' }).format(
                new Date(item.effectiveDate),
              )}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <a
            href={src}
            className="rounded-full p-2 text-white/85 hover:bg-white/10 hover:text-white"
            aria-label={labels.download}
            title={labels.download}
          >
            <Download className="h-5 w-5" aria-hidden="true" />
          </a>
          <Link
            href={`/archief/${item.id}`}
            className="rounded-full p-2 text-white/85 hover:bg-white/10 hover:text-white"
            aria-label={labels.details}
            title={labels.details}
          >
            <Info className="h-5 w-5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/85 hover:bg-white/10 hover:text-white"
            aria-label={labels.close}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-2">
        {index > 0 ? (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={labels.prev}
            className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
        ) : null}

        {item.type === 'video' ? (
          <video src={src} controls autoPlay className="max-h-full max-w-full" />
        ) : item.type === 'audio' ? (
          <audio src={src} controls autoPlay className="w-full max-w-lg" />
        ) : item.type === 'document' ? (
          <a href={src} className="rounded-button text-ink bg-white/90 px-4 py-2 font-medium">
            {labels.download}
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={title} className="max-h-full max-w-full object-contain" />
        )}

        {index < items.length - 1 ? (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={labels.next}
            className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
