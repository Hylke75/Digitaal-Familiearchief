'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { JustifiedGrid } from '@/components/archive/JustifiedGrid';
import { Lightbox } from '@/components/archive/Lightbox';
import { loadTimelineFilterAction, type TimelineFilter } from '@/lib/archive/media-actions';
import { groupByMonth, isOnThisDay } from '@/lib/archive/grouping';
import type { MediaCard } from '@/lib/archive/queries';

/**
 * "Mijn leven" — memories grouped by month, newest first, with an on-this-day
 * highlight. Holds loaded items in client state and re-groups as further pages
 * stream in via the server action.
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
    onThisDay: string;
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

  const today = useMemo(() => {
    const d = new Date();
    return { month: d.getMonth() + 1, day: d.getDate() };
  }, []);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  );

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
  const onThisDay = items
    .filter((i) => isOnThisDay(i.effectiveDate, today.month, today.day))
    .slice(0, 8);
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

      {onThisDay.length > 0 && filter === 'all' ? (
        <section>
          <h2 className="text-h3 text-ink mb-3">{labels.onThisDay}</h2>
          <JustifiedGrid items={onThisDay} onOpen={openLocal(onThisDay)} />
        </section>
      ) : null}

      {groups.map((group) => (
        <section key={group.key}>
          <h2 className="text-h3 text-ink mb-3 capitalize">
            {group.monthStart ? monthLabel.format(new Date(group.monthStart)) : labels.unknownDate}
          </h2>
          <JustifiedGrid items={group.items} onOpen={openLocal(group.items)} />
        </section>
      ))}

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
