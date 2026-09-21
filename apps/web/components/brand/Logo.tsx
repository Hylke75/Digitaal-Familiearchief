import Link from 'next/link';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'icon' | 'stacked';
type Theme = 'light' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const MARK_SIZE: Record<Size, string> = { sm: 'h-6 w-6', md: 'h-8 w-8', lg: 'h-10 w-10' };
const WORD_SIZE: Record<Size, string> = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' };

/** The Bewora mark: a spine with two stacked page/archive layers (§10). Uses
 * currentColor so a parent text-colour themes it. */
function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <rect x="16" y="14" width="8" height="36" rx="4" />
      <path d="M24 14h11a8.5 8.5 0 0 1 0 17H24z" />
      <path d="M24 33h14a8.5 8.5 0 0 1 0 17H24z" />
    </svg>
  );
}

/**
 * Single source of the Bewora logo (docs/BRAND.md §11). Never duplicate logo
 * markup — use this component. `icon` renders the mark only; `primary` is the
 * horizontal lockup; `stacked` places the wordmark under the mark.
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
  const markColor = theme === 'dark' ? 'text-warm' : 'text-forest';
  const wordColor = theme === 'dark' ? 'text-warm' : 'text-ink';

  const inner =
    variant === 'icon' ? (
      <Mark className={cn(MARK_SIZE[size], markColor)} />
    ) : (
      <span
        className={cn(
          'inline-flex',
          variant === 'stacked' ? 'flex-col items-center gap-1.5' : 'items-center gap-2',
        )}
      >
        <Mark className={cn(MARK_SIZE[size], markColor)} />
        <span className={cn('font-semibold tracking-tight', WORD_SIZE[size], wordColor)}>
          Bewora
        </span>
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
