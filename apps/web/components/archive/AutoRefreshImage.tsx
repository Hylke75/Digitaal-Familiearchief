'use client';

import { useState } from 'react';

/**
 * An <img> that recovers from an expired signed URL. Thumbnail URLs are signed
 * for a few hours; a tab left open longer would otherwise show a broken image.
 * On the first load error we fetch a fresh signed URL for the item and swap it
 * in (once, so a genuinely missing file never loops).
 */
export function AutoRefreshImage({
  itemId,
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
}: {
  itemId: string;
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
}) {
  const [current, setCurrent] = useState(src);
  const [refreshed, setRefreshed] = useState(false);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      onError={async () => {
        if (refreshed) return;
        setRefreshed(true);
        try {
          const res = await fetch(`/api/archive/thumb/${itemId}`, { cache: 'no-store' });
          if (!res.ok) return;
          const data = (await res.json()) as { url?: string | null };
          if (data.url) setCurrent(data.url);
        } catch {
          // Offline or transient — leave the broken image; a reload recovers.
        }
      }}
    />
  );
}
