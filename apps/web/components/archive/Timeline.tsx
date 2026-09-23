'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { CheckSquare, Download, Images, Star, X } from 'lucide-react';
import { JustifiedGrid } from '@/components/archive/JustifiedGrid';
import { Lightbox } from '@/components/archive/Lightbox';
import {
  bulkFavouriteAction,
  loadTimelineFilterAction,
  type TimelineFilter,
} from '@/lib/archive/media-actions';
import { bulkAddToAlbumAction, listAlbumTitlesAction } from '@/lib/archive/album-actions';
import { groupByMonth } from '@/lib/archive/grouping';
import { clusterMoments } from '@/lib/archive/moments';
import type { MediaCard } from '@/lib/archive/queries';

type Zoom = 'day' | 'month' | 'year';

/**
 * "Mijn leven" — photos and videos grouped by month, newest first, with filter
 * chips (Alles/Foto's/Video's/Favorieten). Holds loaded items in client state
 * and re-groups as further pages stream in. On-this-day lives on Vandaag (§D8).
 */
export function Timeline({
  initial,
  hasMore: initialHasMore,
  locale,
  labels,
}: {
  initial: MediaCard[];
  hasMore: boolean;
  locale: string;
  labels: {
    loadMore: string;
    loading: string;
    unknownDate: string;
  };
}) {
  const t = useTranslations();
  const [items, setItems] = useState<MediaCard[]>(initial);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [zoom, setZoom] = useState<Zoom>('month');
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [albumsForPicker, setAlbumsForPicker] = useState<Array<{ id: string; title: string }>>([]);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [pending, startTransition] = useTransition();
  const lastGi = useRef<number | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const chips: Array<{ key: TimelineFilter; label: string }> = [
    { key: 'all', label: t('archive.all') },
    { key: 'photo', label: t('nav.photos') },
    { key: 'video', label: t('nav.videos') },
    { key: 'favourites', label: t('nav.favourites') },
  ];
  const zooms: Array<{ key: Zoom; label: string }> = [
    { key: 'day', label: t('archive.zoomDay') },
    { key: 'month', label: t('archive.zoomMonth') },
    { key: 'year', label: t('archive.zoomYear') },
  ];
  const targetHeight = zoom === 'day' ? 260 : zoom === 'year' ? 78 : 150;

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  );
  const dayLabel = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'long' }), [locale]);

  const load = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const next = await loadTimelineFilterAction(filter, page + 1);
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...next.items.filter((i) => !seen.has(i.id))];
      });
      setPage((p) => p + 1);
      setHasMore(next.hasMore);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, filter]);

  const applyFilter = useCallback(async (next: TimelineFilter) => {
    setFilter(next);
    setLoading(true);
    setOpen(null);
    try {
      const res = await loadTimelineFilterAction(next, 0);
      setItems(res.items);
      setPage(0);
      setHasMore(res.hasMore);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void load();
      },
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  const indexById = useMemo(() => new Map(items.map((it, i) => [it.id, i])), [items]);
  const groups = groupByMonth(items);
  const openLocal = (list: MediaCard[]) => (local: number) => {
    const id = list[local]?.id;
    if (id != null) setOpen(indexById.get(id) ?? null);
  };

  const toggleSelect = (list: MediaCard[]) => (local: number, shift: boolean) => {
    const id = list[local]?.id;
    if (id == null) return;
    const gi = indexById.get(id);
    if (gi == null) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (shift && lastGi.current != null) {
        const [a, b] = [Math.min(lastGi.current, gi), Math.max(lastGi.current, gi)];
        for (let i = a; i <= b; i++) {
          const itId = items[i]?.id;
          if (itId) next.add(itId);
        }
      } else {
        if (next.has(id)) next.delete(id);
        else next.add(id);
        lastGi.current = gi;
      }
      return next;
    });
  };

  const exitSelect = () => {
    setSelecting(false);
    setSelected(new Set());
    setShowAlbumPicker(false);
    lastGi.current = null;
  };

  const selectedIds = () => Array.from(selected);
  const doFavourite = () =>
    startTransition(async () => {
      await bulkFavouriteAction(selectedIds());
      exitSelect();
    });
  const openAlbumPicker = () =>
    startTransition(async () => {
      setAlbumsForPicker(await listAlbumTitlesAction());
      setShowAlbumPicker(true);
    });
  const doAlbum = (albumId: string) =>
    startTransition(async () => {
      await bulkAddToAlbumAction(albumId, selectedIds());
      exitSelect();
    });

  const years = Array.from(
    new Set(groups.filter((g) => g.monthStart).map((g) => g.key.slice(0, 4))),
  );

  // Draggable time scrubber: map the pointer's position on the rail to a scroll
  // position and show the month it lands on (design advice, "sleepbare tijdbalk").
  const railRef = useRef<HTMLDivElement | null>(null);
  const [scrubLabel, setScrubLabel] = useState<string | null>(null);
  const scrubbing = useRef(false);

  const currentMonthLabel = (): string => {
    for (const g of groups) {
      const el = document.getElementById(`sec-${g.key}`);
      if (el && el.getBoundingClientRect().top <= 140) {
        return g.monthStart ? monthLabel.format(new Date(g.monthStart)) : labels.unknownDate;
      }
    }
    const first = groups[0];
    return first?.monthStart ? monthLabel.format(new Date(first.monthStart)) : '';
  };

  const scrubTo = (clientY: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    const doc = document.documentElement;
    window.scrollTo({ top: frac * (doc.scrollHeight - window.innerHeight) });
    setScrubLabel(currentMonthLabel());
  };

  return (
    <div className="relative space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const active = chip.key === filter;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => void applyFilter(chip.key)}
                aria-pressed={active}
                className={`rounded-pill text-small border px-3 py-1 font-medium transition-colors ${
                  active
                    ? 'border-forest bg-forest text-white'
                    : 'border-border text-ink-soft hover:bg-warm'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (selecting ? exitSelect() : setSelecting(true))}
            aria-pressed={selecting}
            className={`rounded-pill text-small inline-flex items-center gap-1.5 border px-3 py-1 font-medium transition-colors ${
              selecting
                ? 'border-forest bg-forest text-white'
                : 'border-border text-ink-soft hover:bg-warm'
            }`}
          >
            <CheckSquare className="h-4 w-4" aria-hidden="true" />
            {t('archive.select')}
          </button>
          <div className="border-border rounded-pill inline-flex border p-0.5">
            {zooms.map((z) => {
              const active = z.key === zoom;
              return (
                <button
                  key={z.key}
                  type="button"
                  onClick={() => setZoom(z.key)}
                  aria-pressed={active}
                  className={`rounded-pill text-small px-3 py-1 font-medium transition-colors ${
                    active ? 'bg-forest text-white' : 'text-ink-soft hover:bg-warm'
                  }`}
                >
                  {z.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Draggable time scrubber — drag across the years without endless
          scrolling; a live label shows the month you land on. */}
      {years.length > 1 ? (
        <div
          ref={railRef}
          aria-label="Tijdbalk"
          onPointerDown={(e) => {
            scrubbing.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            scrubTo(e.clientY);
          }}
          onPointerMove={(e) => {
            if (scrubbing.current) scrubTo(e.clientY);
          }}
          onPointerUp={() => {
            scrubbing.current = false;
            setScrubLabel(null);
          }}
          className="fixed right-0 top-1/2 z-20 hidden h-[60vh] w-10 -translate-y-1/2 cursor-ns-resize touch-none select-none flex-col items-end justify-between py-2 pr-1 lg:flex"
        >
          {years.map((y) => (
            <span key={y} className="text-ink-soft text-caption pointer-events-none font-medium">
              {y}
            </span>
          ))}
          {scrubLabel ? (
            <span className="bg-forest rounded-button text-small absolute right-8 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 font-medium text-white shadow-lg">
              {scrubLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      {groups.map((group) => {
        const cover = group.items[0];
        const moments = clusterMoments(group.items);
        return (
          <section key={group.key} id={`sec-${group.key}`} className="scroll-mt-4">
            <h2 className="text-h3 text-ink mb-3 capitalize">
              {group.monthStart
                ? monthLabel.format(new Date(group.monthStart))
                : labels.unknownDate}
            </h2>

            {/* Opening image for the period — one large beeld, not fifteen equal tiles. */}
            {cover?.thumbUrl ? (
              <button
                type="button"
                onClick={(e) =>
                  selecting ? toggleSelect(group.items)(0, e.shiftKey) : openLocal(group.items)(0)
                }
                aria-label={cover.filename}
                aria-pressed={selecting ? selected.has(cover.id) : undefined}
                className={`bg-warm group relative mb-2 block h-56 w-full overflow-hidden rounded-[4px] sm:h-72 ${
                  selecting && selected.has(cover.id) ? 'ring-forest ring-2 ring-offset-1' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover.thumbUrl}
                  alt={cover.filename}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </button>
            ) : null}

            {moments.map((moment, mi) => {
              const gridItems = mi === 0 ? moment.slice(1) : moment;
              if (gridItems.length === 0) return null;
              const first = moment[0]?.effectiveDate;
              return (
                <div key={mi} className="mt-3">
                  {first ? (
                    <h3 className="text-ink-soft text-small mb-2 font-medium capitalize">
                      {dayLabel.format(new Date(first))}
                      {moment.length > 1 ? ` · ${moment.length}` : ''}
                    </h3>
                  ) : null}
                  <JustifiedGrid
                    items={gridItems}
                    onOpen={openLocal(gridItems)}
                    targetHeight={targetHeight}
                    selectionMode={selecting}
                    selectedIds={selected}
                    onToggle={toggleSelect(gridItems)}
                  />
                </div>
              );
            })}
          </section>
        );
      })}

      {hasMore ? (
        <div ref={sentinel} className="flex justify-center">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-button border-border text-ink-soft hover:bg-warm text-small border px-4 py-2 font-medium transition-colors disabled:opacity-60"
          >
            {loading ? labels.loading : labels.loadMore}
          </button>
        </div>
      ) : null}

      {open !== null && !selecting ? (
        <Lightbox items={items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
      ) : null}

      {selecting && selected.size > 0 ? (
        <div className="border-border bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
            <span className="text-small text-ink font-medium">
              {t('archive.selected', { count: selected.size })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={doFavourite}
                disabled={pending}
                className="rounded-button border-border text-ink-soft hover:bg-warm text-small inline-flex items-center gap-1.5 border px-3 py-1.5 font-medium disabled:opacity-60"
              >
                <Star className="h-4 w-4" aria-hidden="true" />
                {t('nav.favourites')}
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={openAlbumPicker}
                  disabled={pending}
                  className="rounded-button border-border text-ink-soft hover:bg-warm text-small inline-flex items-center gap-1.5 border px-3 py-1.5 font-medium disabled:opacity-60"
                >
                  <Images className="h-4 w-4" aria-hidden="true" />
                  {t('archive.addToAlbum')}
                </button>
                {showAlbumPicker ? (
                  <div className="border-border rounded-card absolute bottom-full right-0 mb-2 w-56 border bg-white p-2 shadow-lg">
                    {albumsForPicker.length === 0 ? (
                      <p className="text-ink-soft text-small p-2">{t('albums.noAlbumsYet')}</p>
                    ) : (
                      <ul className="max-h-56 overflow-auto">
                        {albumsForPicker.map((a) => (
                          <li key={a.id}>
                            <button
                              type="button"
                              onClick={() => doAlbum(a.id)}
                              className="hover:bg-warm text-body w-full truncate rounded-[8px] px-2 py-2 text-left"
                            >
                              {a.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
              <a
                href={`/api/export?ids=${Array.from(selected).join(',')}`}
                className="rounded-button border-border text-ink-soft hover:bg-warm text-small inline-flex items-center gap-1.5 border px-3 py-1.5 font-medium"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {t('archive.download')}
              </a>
              <button
                type="button"
                onClick={exitSelect}
                aria-label={t('archive.deselect')}
                className="rounded-button text-ink-soft hover:bg-warm p-2"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
