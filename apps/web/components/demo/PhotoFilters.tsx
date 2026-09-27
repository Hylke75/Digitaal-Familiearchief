'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Heart, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface FilterOptions {
  sources: { key: string; label: string }[];
  years: number[];
  places: string[];
  people: string[];
}

/**
 * One reusable, URL-backed filter bar (§22, §30, §31). Every facet is a query
 * param; back/forward preserves the browse state. Facets combine.
 */
export function PhotoFilters({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value == null || value === '') next.delete(key);
      else next.set(key, value);
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const get = (k: string) => params.get(k) ?? '';
  const hasAny = ['source', 'year', 'place', 'person', 'favorite', 'q', 'sort'].some((k) =>
    params.get(k),
  );

  const selectClass =
    'rounded-button border-border-strong text-small text-ink h-9 border bg-surface px-3';

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <label className="relative">
        <Search
          className="text-ink-soft pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          type="search"
          defaultValue={get('q')}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Zoeken"
          aria-label="Zoeken in foto's"
          className="rounded-button border-border-strong text-small text-ink bg-surface h-9 border pl-8 pr-3"
        />
      </label>

      <select
        aria-label="Bron"
        className={selectClass}
        value={get('source')}
        onChange={(e) => setParam('source', e.target.value)}
      >
        <option value="">Alle bronnen</option>
        {options.sources.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Jaar"
        className={selectClass}
        value={get('year')}
        onChange={(e) => setParam('year', e.target.value)}
      >
        <option value="">Alle jaren</option>
        {options.years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        aria-label="Plaats"
        className={selectClass}
        value={get('place')}
        onChange={(e) => setParam('place', e.target.value)}
      >
        <option value="">Alle plaatsen</option>
        {options.places.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        aria-label="Persoon"
        className={selectClass}
        value={get('person')}
        onChange={(e) => setParam('person', e.target.value)}
      >
        <option value="">Iedereen</option>
        {options.people.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <button
        type="button"
        aria-pressed={get('favorite') === '1'}
        onClick={() => setParam('favorite', get('favorite') === '1' ? null : '1')}
        className={cn(
          'rounded-button text-small inline-flex h-9 items-center gap-1.5 border px-3 font-semibold transition-colors',
          get('favorite') === '1'
            ? 'border-brass bg-soft-amber text-warning'
            : 'border-border-strong text-ink-soft hover:bg-warm bg-surface',
        )}
      >
        <Heart
          className={cn('h-4 w-4', get('favorite') === '1' && 'fill-current')}
          aria-hidden="true"
        />
        Favoriet
      </button>

      <select
        aria-label="Sorteren"
        className={selectClass}
        value={get('sort') || 'captured_desc'}
        onChange={(e) =>
          setParam('sort', e.target.value === 'captured_desc' ? null : e.target.value)
        }
      >
        <option value="captured_desc">Datum gemaakt ↓</option>
        <option value="captured_asc">Datum gemaakt ↑</option>
        <option value="added_desc">Toegevoegd ↓</option>
        <option value="added_asc">Toegevoegd ↑</option>
      </select>

      {hasAny ? (
        <button
          type="button"
          onClick={() => router.push(pathname, { scroll: false })}
          className="text-ink-soft hover:text-ink text-small inline-flex h-9 items-center gap-1 underline underline-offset-2"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" /> Wissen
        </button>
      ) : null}
    </div>
  );
}
