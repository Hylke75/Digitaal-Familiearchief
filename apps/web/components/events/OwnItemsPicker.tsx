'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ImagePlus, Loader2 } from 'lucide-react';
import { AutoRefreshImage } from '@/components/archive/AutoRefreshImage';
import { addOwnItemsToEventAction } from '@/lib/archive/events-actions';
import type { MediaCard } from '@/lib/archive/queries';

interface Labels {
  addOwn: string;
  addOwnHint: string;
  addSelected: (count: number) => string;
  addOwnEmpty: string;
}

/**
 * Eigen herinneringen aan een gebeurtenis koppelen. Toont een raster van de
 * eigen foto's (al gekoppelde zijn er server-side uitgefilterd); aangetikte
 * items worden meteen goedgekeurd toegevoegd.
 */
export function OwnItemsPicker({
  eventId,
  candidates,
  labels,
}: {
  eventId: string;
  candidates: MediaCard[];
  labels: Labels;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const add = () => {
    if (selected.size === 0) return;
    const ids = [...selected];
    startTransition(async () => {
      await addOwnItemsToEventAction(eventId, ids);
      setSelected(new Set());
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <section className="border-border rounded-card border p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-h4 text-ink flex items-center gap-2">
            <ImagePlus className="text-ink-soft h-5 w-5" aria-hidden="true" />
            {labels.addOwn}
          </h2>
          <p className="text-small text-ink-soft mt-1">{labels.addOwnHint}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded-button border-border text-small hover:bg-warm shrink-0 border px-4 py-2 font-medium"
        >
          {labels.addOwn}
        </button>
      </div>

      {open ? (
        candidates.length === 0 ? (
          <p className="text-small text-ink-soft mt-4">{labels.addOwnEmpty}</p>
        ) : (
          <div className="mt-4">
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {candidates.map((c) => {
                const on = selected.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggle(c.id)}
                      aria-pressed={on}
                      className={`bg-warm relative block aspect-square w-full overflow-hidden rounded-lg ring-2 ${
                        on ? 'ring-forest' : 'ring-transparent'
                      }`}
                    >
                      {c.thumbUrl ? (
                        <AutoRefreshImage
                          itemId={c.id}
                          src={c.thumbUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                      {on ? (
                        <span className="bg-forest absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-white">
                          <Check className="h-3 w-3" aria-hidden="true" />
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={add}
              disabled={pending || selected.size === 0}
              className="rounded-button bg-forest text-small mt-4 inline-flex items-center gap-2 px-5 py-2.5 font-medium text-white disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {labels.addSelected(selected.size)}
            </button>
          </div>
        )
      ) : null}
    </section>
  );
}
