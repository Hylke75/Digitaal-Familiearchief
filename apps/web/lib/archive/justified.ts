/**
 * Pure justified-grid layout (no I/O, unit-tested). Like Google Photos / Immich:
 * images keep their own aspect ratio and each row is scaled to fill the exact
 * container width, so there are no square crops and no gaps (design advice,
 * Advice A "uitgevuld raster"). The last row keeps the target height rather than
 * stretching a lone image across the screen.
 */

export interface LayoutCell {
  index: number;
  width: number;
  height: number;
}

const MIN_ASPECT = 0.4; // clamp extreme panoramas/portraits so a row stays sane
const MAX_ASPECT = 3.5;

/**
 * @param aspects width/height per item (defaults handled by the caller)
 * @param containerWidth available width in px
 * @param targetHeight preferred row height in px
 * @param gap gap between cells in px
 */
export function justifiedLayout(
  aspects: number[],
  containerWidth: number,
  targetHeight: number,
  gap: number,
): LayoutCell[][] {
  const rows: LayoutCell[][] = [];
  if (containerWidth <= 0 || targetHeight <= 0) return rows;

  let current: number[] = [];
  let aspectSum = 0;

  const flush = (indices: number[], sum: number, stretch: boolean) => {
    const gaps = (indices.length - 1) * gap;
    const rowHeight = stretch
      ? (containerWidth - gaps) / sum
      : Math.min(targetHeight, (containerWidth - gaps) / sum);
    rows.push(
      indices.map((index) => ({
        index,
        width: clampAspect(aspects[index]!) * rowHeight,
        height: rowHeight,
      })),
    );
  };

  for (let i = 0; i < aspects.length; i++) {
    const aspect = clampAspect(aspects[i]!);
    current.push(i);
    aspectSum += aspect;
    const gaps = (current.length - 1) * gap;
    if (aspectSum * targetHeight + gaps >= containerWidth) {
      flush(current, aspectSum, true);
      current = [];
      aspectSum = 0;
    }
  }
  if (current.length > 0) flush(current, aspectSum, false);
  return rows;
}

function clampAspect(aspect: number | undefined): number {
  if (!aspect || !Number.isFinite(aspect) || aspect <= 0) return 1;
  return Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, aspect));
}
