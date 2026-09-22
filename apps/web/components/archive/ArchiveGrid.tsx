'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaTile } from '@/components/archive/MediaTile';
import { loadMoreFavouritesAction, loadMoreMediaAction } from '@/lib/archive/media-actions';
import type { ArchiveItemType, MediaCard } from '@/lib/archive/queries';

/**
 * Client-side infinite-scroll grid. Renders the server-provided first page, then
 * loads further pages through a server action as a sentinel scrolls into view.
 * Signed thumbnail URLs come pre-baked on each card (valid for the session).
 */
export function ArchiveGrid({
  initial,
  hasMore: initialHasMore,
  type = null,
  variant = 'media',
  locale,
  loadMoreLabel,
  loadingLabel,
}: {
  initial: MediaCard[];
  hasMore: boolean;
  type?: ArchiveItemType | null;
  variant?: 'media' | 'favourites';
  locale: string;
  loadMoreLabel: string;
  loadingLabel: string;
}) {
  const [items, setItems] = useState<MediaCard[]>(initial);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const next =
        variant === 'favourites'
          ? await loadMoreFavouritesAction(page + 1)
          : await loadMoreMediaAction(type, page + 1);
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...next.items.filter((i) => !seen.has(i.id))];
      });
      setPage((p) => p + 1);
      setHasMore(next.hasMore);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, type, variant]);

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

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.id}>
            <MediaTile item={item} locale={locale} />
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div ref={sentinel} className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-button border-border text-ink-soft hover:bg-warm text-small border px-4 py-2 font-medium transition-colors disabled:opacity-60"
          >
            {loading ? loadingLabel : loadMoreLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
