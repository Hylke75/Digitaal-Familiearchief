import { cn } from '@/lib/cn';

/**
 * Inviting empty state (docs/DESIGN.md §43) — never a dry "No data", always a
 * gentle prompt with a next action.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-card border-border bg-surface flex flex-col items-center gap-3 border border-dashed px-6 py-14 text-center',
        className,
      )}
    >
      {icon ? <div className="text-forest/70">{icon}</div> : null}
      <h3 className="text-h3 text-ink">{title}</h3>
      {description ? <p className="text-body text-ink-soft max-w-md">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
