'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Download, Info, X } from 'lucide-react';
import type { MediaCard } from '@/lib/archive/queries';
import { formatDuration, stripExtension } from '@/lib/archive/display';

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
  const f = useFormatter();
  const item = items[index];
  const touchX = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const go = useCallback(
    (delta: number) => {
      const next = index + delta;
      if (next >= 0 && next < items.length) onIndex(next);
    },
    [index, items.length, onIndex],
  );

  // Reflect the open item in the URL (/archief/[id]) so sharing and the browser
  // back button work — without leaving the timeline (the overlay stays mounted).
  // One history entry is pushed for the whole session and updated as you page;
  // closing pops it, and browser-back closes the overlay.
  useEffect(() => {
    const origin = window.location.pathname + window.location.search;
    let popped = false;
    window.history.pushState({ lightbox: true }, '', `/archief/${items[index]?.id ?? ''}`);
    const onPop = () => {
      popped = true;
      onClose();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!popped) window.history.pushState(null, '', origin);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL on the currently-viewed item while paging (same history entry).
  useEffect(() => {
    const it = items[index];
    if (it) window.history.replaceState({ lightbox: true }, '', `/archief/${it.id}`);
  }, [index, items]);

  // Arrow/Escape navigation — re-bound when the index changes so it always
  // pages from the current position.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  // Focus management + Tab trap — mount-only so focus doesn't jump between items.
  useEffect(() => {
    const restoreTo = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), video, audio, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      // Keep Tab focus inside the modal (WCAG 2.2 — no focus escape).
      const els = focusables();
      const first = els[0];
      const last = els[els.length - 1];
      if (!first || !last) {
        e.preventDefault();
        return;
      }
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onTab);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    focusables()[0]?.focus();
    return () => {
      window.removeEventListener('keydown', onTab);
      document.body.style.overflow = prevOverflow;
      restoreTo?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!item) return null;
  const src = `/archief/download/${item.id}`;
  const title = stripExtension(item.filename);

  // Panel fields — deliberately WITHOUT file size (that belongs only on the
  // detail page). Location is shown as coordinates; a named place is future work.
  const infoRows: [string, string][] = [];
  if (item.effectiveDate) {
    infoRows.push([t('metaDate'), f.dateTime(new Date(item.effectiveDate), { dateStyle: 'full' })]);
  }
  infoRows.push([t('metaType'), t(item.type)]);
  if (item.width && item.height) {
    infoRows.push([t('metaDimensions'), `${item.width} × ${item.height}`]);
  }
  if (item.durationMs) infoRows.push([t('metaDuration'), formatDuration(item.durationMs)]);
  if (item.latitude != null && item.longitude != null) {
    infoRows.push([t('metaLocation'), `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`]);
  }

  return (
    <div
      ref={dialogRef}
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
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            aria-expanded={showInfo}
            aria-controls="lightbox-info"
            className={`rounded-full p-2 hover:bg-white/10 hover:text-white ${
              showInfo ? 'bg-white/15 text-white' : 'text-white/85'
            }`}
            aria-label={t('info')}
            title={t('info')}
          >
            <Info className="h-5 w-5" aria-hidden="true" />
          </button>
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

        {showInfo ? (
          <aside
            id="lightbox-info"
            className="absolute right-0 top-0 z-20 h-full w-80 max-w-[85vw] overflow-y-auto bg-black/85 p-5 text-white backdrop-blur"
          >
            <h2 className="mb-4 break-words font-medium">{title}</h2>
            <dl className="space-y-3">
              {infoRows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-caption text-white/60">{label}</dt>
                  <dd className="text-small text-white/90">{value}</dd>
                </div>
              ))}
            </dl>
            <Link
              href={`/archief/${item.id}`}
              className="rounded-button mt-5 inline-flex items-center gap-1.5 bg-white/10 px-3 py-2 text-white/90 hover:bg-white/20"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              {t('fullPage')}
            </Link>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
