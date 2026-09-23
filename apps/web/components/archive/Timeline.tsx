'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { JustifiedGrid } from '@/components/archive/JustifiedGrid';
import { Lightbox } from '@/components/archive/Lightbox';
import { loadTimelineFilterAction, type TimelineFilter } from '@/lib/archive/media-actions';
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

  const years = Array.from(
    new Set(groups.filter((g) => g.monthStart).map((g) => g.key.slice(0, 4))),
  );
  const jumpToYear = (y: string) => {
    const g = groups.find((gr) => gr.key.startsWith(y));
    if (g) document.getElementById(`sec-${g.key}`)?.scrollIntoView({ behavior: 'smooth' });
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

      {/* Draggable-year rail — jump across the archive without endless scrolling. */}
      {years.length > 1 ? (
        <nav
          aria-label="Jaren"
          className="fixed right-1 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-end gap-1 lg:flex"
        >
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => jumpToYear(y)}
              className="text-ink-soft hover:text-forest text-caption rounded px-1.5 py-0.5 font-medium hover:bg-white/70"
            >
              {y}
            </button>
          ))}
        </nav>
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
                onClick={() => openLocal(group.items)(0)}
                aria-label={cover.filename}
                className="bg-warm group mb-2 block h-56 w-full overflow-hidden rounded-[4px] sm:h-72"
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

      {open !== null ? (
        <Lightbox items={items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
      ) : null}
    </div>
  );
}
