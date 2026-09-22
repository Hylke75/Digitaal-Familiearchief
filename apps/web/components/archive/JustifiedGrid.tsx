'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Play, Star } from 'lucide-react';
import { justifiedLayout } from '@/lib/archive/justified';
import { formatDuration, stripExtension } from '@/lib/archive/display';
import type { MediaCard } from '@/lib/archive/queries';

/**
 * Uncropped, full-width justified grid (design advice, Advice A). Images keep
 * their aspect ratio and each row fills the container exactly; clicking a tile
 * opens the lightbox. Falls back to a labelled file tile for items without a
 * preview (documents), until they get their own environment.
 */
export function JustifiedGrid({
  items,
  onOpen,
  targetHeight = 200,
  gap = 3,
}: {
  items: MediaCard[];
  onOpen: (index: number) => void;
  targetHeight?: number;
  gap?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0]?.contentRect.width ?? 0));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const aspects = items.map((it) => (it.width && it.height ? it.width / it.height : 1));
  const rows = width > 0 ? justifiedLayout(aspects, width, targetHeight, gap) : [];

  return (
    <div ref={ref} className="flex flex-col" style={{ gap }}>
      {rows.map((row, ri) => (
        <div key={ri} className="flex" style={{ gap }}>
          {row.map((cell) => {
            const it = items[cell.index]!;
            return (
              <Cell
                key={it.id}
                item={it}
                width={cell.width}
                height={cell.height}
                onClick={() => onOpen(cell.index)}
              />
            );
          })}
        </div>
      ))}
      {/* Reserve height on first paint so the grid doesn't jump while measuring. */}
      {rows.length === 0 ? <div style={{ height: targetHeight }} /> : null}
    </div>
  );
}

function Cell({
  item,
  width,
  height,
  onClick,
}: {
  item: MediaCard;
  width: number;
  height: number;
  onClick: () => void;
}) {
  const title = stripExtension(item.filename);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width, height }}
      aria-label={title}
      className="bg-warm group relative shrink-0 overflow-hidden rounded-[3px]"
    >
      {item.thumbUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbUrl}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <span className="text-ink-soft flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
          <FileText className="h-6 w-6" aria-hidden="true" />
          <span className="line-clamp-2 text-[11px] leading-tight">{title}</span>
        </span>
      )}

      {item.type === 'video' ? (
        <>
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
              <Play className="h-5 w-5" aria-hidden="true" />
            </span>
          </span>
          {item.durationMs ? (
            <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white">
              {formatDuration(item.durationMs)}
            </span>
          ) : null}
        </>
      ) : null}

      {item.favourite ? (
        <span className="text-brass absolute left-1.5 top-1.5 drop-shadow">
          <Star className="h-4 w-4 fill-current" aria-hidden="true" />
        </span>
      ) : null}
    </button>
  );
}
