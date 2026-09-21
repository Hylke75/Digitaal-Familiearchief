import Link from 'next/link';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'icon' | 'stacked';
type Theme = 'light' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const MARK_H: Record<Size, string> = { sm: 'h-7', md: 'h-9', lg: 'h-11' };
const WORD: Record<Size, string> = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' };

/** The Bewora leaf-B mark (supplied brand asset). Light variant for dark panels. */
function Mark({ theme, size }: { theme: Theme; size: Size }) {
  const src = theme === 'dark' ? '/brand/bewora-mark-light.png' : '/brand/bewora-mark.png';
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" aria-hidden="true" className={cn('w-auto', MARK_H[size])} />
  );
}

/**
 * Single source of the Bewora logo (docs/BRAND.md §11). Uses the supplied leaf-B
 * mark plus the Bewora wordmark. `icon` = mark only; `primary` = horizontal
 * lockup; `stacked` = wordmark under the mark. Never duplicate logo markup.
 */
export function Logo({
  variant = 'primary',
  theme = 'light',
  size = 'md',
  className,
  href,
}: {
  variant?: Variant;
  theme?: Theme;
  size?: Size;
  className?: string;
  href?: string;
}) {
  const wordColor = theme === 'dark' ? 'text-warm' : 'text-ink';

  const inner =
    variant === 'icon' ? (
      <Mark theme={theme} size={size} />
    ) : (
      <span
        className={cn(
          'inline-flex',
          variant === 'stacked' ? 'flex-col items-center gap-1' : 'items-center gap-2',
        )}
      >
        <Mark theme={theme} size={size} />
        <span className={cn('font-semibold tracking-tight', WORD[size], wordColor)}>Bewora</span>
      </span>
    );

  if (href) {
    return (
      <Link href={href} aria-label="Bewora" className={cn('inline-flex', className)}>
        {inner}
      </Link>
    );
  }
  return <span className={cn('inline-flex', className)}>{inner}</span>;
}
