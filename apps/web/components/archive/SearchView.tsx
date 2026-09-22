'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { JustifiedGrid } from '@/components/archive/JustifiedGrid';
import { Lightbox } from '@/components/archive/Lightbox';
import { searchMediaAction } from '@/lib/archive/search-actions';
import type { ArchiveItemType, MediaCard } from '@/lib/archive/queries';

const FACETS: Array<ArchiveItemType | null> = [null, 'photo', 'video', 'document'];

export function SearchView({
  locale: _locale,
  labels,
  typeLabels,
}: {
  locale: string;
  labels: {
    placeholder: string;
    submit: string;
    all: string;
    hint: string;
    noResults: string;
    loadMore: string;
    loading: string;
  };
  typeLabels: Record<'photo' | 'video' | 'document', string>;
}) {
  const [q, setQ] = useState('');
  const [type, setType] = useState<ArchiveItemType | null>(null);
  const [items, setItems] = useState<MediaCard[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const doSearch = useCallback(async (qArg: string, typeArg: ArchiveItemType | null) => {
    setLoading(true);
    setType(typeArg);
    try {
      const res = await searchMediaAction(qArg, typeArg, 0);
      setItems(res.items);
      setHasMore(res.hasMore);
      setPage(0);
      setSearched(true);
      setLastQuery(qArg.trim());
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await searchMediaAction(q, type, page + 1);
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...res.items.filter((i) => !seen.has(i.id))];
      });
      setPage((p) => p + 1);
      setHasMore(res.hasMore);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, q, type, page]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const facetLabel = (facet: ArchiveItemType | null): string =>
    facet === null
      ? labels.all
      : facet === 'photo' || facet === 'video' || facet === 'document'
        ? typeLabels[facet]
        : facet;

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void doSearch(q, type);
        }}
        className="mb-4 flex max-w-xl gap-2"
      >
        <div className="relative flex-1">
          <Search
            className="text-ink-soft pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={labels.placeholder}
            aria-label={labels.placeholder}
            className="border-border rounded-button focus:border-forest text-body w-full border py-2 pl-9 pr-3 outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-button bg-forest text-small px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
        >
          {labels.submit}
        </button>
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        {FACETS.map((facet) => {
          const active = facet === type;
          return (
            <button
              key={facet ?? 'all'}
              type="button"
              onClick={() => void doSearch(q, facet)}
              aria-pressed={active}
              className={`rounded-pill text-small border px-3 py-1 font-medium transition-colors ${
                active
                  ? 'border-forest bg-forest text-white'
                  : 'border-border text-ink-soft hover:bg-warm'
              }`}
            >
              {facetLabel(facet)}
            </button>
          );
        })}
      </div>

      {!searched ? (
        <p className="text-ink-soft text-body">{labels.hint}</p>
      ) : items.length === 0 ? (
        <p className="text-ink-soft text-body">
          {labels.noResults} “{lastQuery}”.
        </p>
      ) : (
        <>
          <JustifiedGrid items={items} onOpen={setOpen} />
          {hasMore ? (
            <div ref={sentinel} className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loading}
                className="rounded-button border-border text-ink-soft hover:bg-warm text-small border px-4 py-2 font-medium transition-colors disabled:opacity-60"
              >
                {loading ? labels.loading : labels.loadMore}
              </button>
            </div>
          ) : null}
        </>
      )}
      {open !== null ? (
        <Lightbox items={items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
      ) : null}
    </div>
  );
}
