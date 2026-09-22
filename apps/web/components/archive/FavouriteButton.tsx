'use client';

import { useState, useTransition } from 'react';
import { Star } from 'lucide-react';
import { toggleFavouriteAction } from '@/lib/archive/media-actions';

/** Optimistic favourite toggle for the item detail view. */
export function FavouriteButton({
  itemId,
  initial,
  addLabel,
  removeLabel,
}: {
  itemId: string;
  initial: boolean;
  addLabel: string;
  removeLabel: string;
}) {
  const [favourite, setFavourite] = useState(initial);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !favourite;
    setFavourite(next); // optimistic
    startTransition(async () => {
      const confirmed = await toggleFavouriteAction(itemId, next);
      setFavourite(confirmed);
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={favourite}
      className={`rounded-button text-small inline-flex items-center gap-2 border px-4 py-2 font-medium transition-colors disabled:opacity-60 ${
        favourite
          ? 'border-brass bg-brass/10 text-brass'
          : 'border-border text-ink-soft hover:bg-warm'
      }`}
    >
      <Star className={`h-4 w-4 ${favourite ? 'fill-current' : ''}`} aria-hidden="true" />
      {favourite ? removeLabel : addLabel}
    </button>
  );
}
