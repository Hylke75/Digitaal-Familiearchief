'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

/**
 * URL-backed filter + sort bar for documents (§31, §33). Every facet is a query
 * param so back/forward preserves the browse state and facets combine. Mirrors
 * the pattern in PhotoFilters.
 */
export function DocControls({
  categories,
  sources,
  years,
}: {
  categories: string[];
  sources: { key: string; label: string }[];
  years: number[];
}) {
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
  const hasAny = ['category', 'source', 'year', 'q', 'sort', 'folder'].some((k) => params.get(k));

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
          aria-label="Zoeken in documenten"
          className="rounded-button border-border-strong text-small text-ink bg-surface h-9 border pl-8 pr-3"
        />
      </label>

      <select
        aria-label="Categorie"
        className={selectClass}
        value={get('category')}
        onChange={(e) => setParam('category', e.target.value)}
      >
        <option value="">Alle categorieën</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        aria-label="Bron"
        className={selectClass}
        value={get('source')}
        onChange={(e) => setParam('source', e.target.value)}
      >
        <option value="">Alle bronnen</option>
        {sources.map((s) => (
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
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        aria-label="Sorteren"
        className={selectClass}
        value={get('sort') || 'date_desc'}
        onChange={(e) => setParam('sort', e.target.value === 'date_desc' ? null : e.target.value)}
      >
        <option value="date_desc">Datum document ↓</option>
        <option value="date_asc">Datum document ↑</option>
        <option value="modified_desc">Laatst gewijzigd</option>
        <option value="name_asc">Naam A-Z</option>
        <option value="name_desc">Naam Z-A</option>
        <option value="added_desc">Nieuw toegevoegd</option>
        <option value="added_asc">Oudst toegevoegd</option>
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
