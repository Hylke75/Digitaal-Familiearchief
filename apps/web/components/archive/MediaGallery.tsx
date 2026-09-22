'use client';

import { useState } from 'react';
import { JustifiedGrid } from '@/components/archive/JustifiedGrid';
import { Lightbox } from '@/components/archive/Lightbox';
import type { MediaCard } from '@/lib/archive/queries';

/**
 * A fixed set of memories as a justified grid with a lightbox — no pagination.
 * Used for the Vandaag strips (on-this-day, recently added) and other bounded
 * galleries.
 */
export function MediaGallery({
  items,
  targetHeight = 200,
}: {
  items: MediaCard[];
  targetHeight?: number;
}) {
  const [open, setOpen] = useState<number | null>(null);
  if (items.length === 0) return null;
  return (
    <>
      <JustifiedGrid items={items} onOpen={setOpen} targetHeight={targetHeight} />
      {open !== null ? (
        <Lightbox items={items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
      ) : null}
    </>
  );
}
