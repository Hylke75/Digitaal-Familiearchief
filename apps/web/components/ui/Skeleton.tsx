import { cn } from '@/lib/cn';

/** Neutral placeholder for normal page loading (docs/DESIGN.md §44). */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-border/60 animate-pulse rounded-md', className)}
      aria-hidden="true"
      {...props}
    />
  );
}
