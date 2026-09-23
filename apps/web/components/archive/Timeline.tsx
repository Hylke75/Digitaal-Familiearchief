'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { JustifiedGrid } from '@/components/archive/JustifiedGrid';
import { Lightbox } from '@/components/archive/Lightbox';
import { loadTimelineFilterAction, type TimelineFilter } from '@/lib/archive/media-actions';
import { groupByMonth } from '@/lib/archive/grouping';
import { clusterMoments } from '@/lib/archive/moments';
import type { MediaCard } from '@/lib/archive/queries';

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
  const sentinel = useRef<HTMLDivElement | null>(null);

  const chips: Array<{ key: TimelineFilter; label: string }> = [
    { key: 'all', label: t('archive.all') },
    { key: 'photo', label: t('nav.photos') },
    { key: 'video', label: t('nav.videos') },
    { key: 'favourites', label: t('nav.favourites') },
  ];

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

  return (
    <div className="space-y-10">
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

      {groups.map((group) => {
        const cover = group.items[0];
        const moments = clusterMoments(group.items);
        return (
          <section key={group.key}>
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
                  <JustifiedGrid items={gridItems} onOpen={openLocal(gridItems)} />
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
