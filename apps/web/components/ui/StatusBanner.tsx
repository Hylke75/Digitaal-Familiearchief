import { AlertTriangle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import type { HealthStatus } from '@dla/archive';
import { cn } from '@/lib/cn';

/**
 * Consumer health states (docs/DESIGN.md §46, §50). One calm status, never a
 * field of red dots. Icon + soft fill mapped from the internal health value.
 */
const styles: Record<HealthStatus, { fill: string; text: string; Icon: typeof CheckCircle2 }> = {
  safe: { fill: 'bg-soft-green', text: 'text-success', Icon: CheckCircle2 },
  archiving: { fill: 'bg-soft-green', text: 'text-success', Icon: RefreshCw },
  action_required: { fill: 'bg-soft-amber', text: 'text-warning', Icon: AlertTriangle },
  temporary_problem: { fill: 'bg-soft-amber', text: 'text-warning', Icon: Clock },
};

export function HealthPill({
  status,
  label,
  className,
}: {
  status: HealthStatus;
  label: string;
  className?: string;
}) {
  const s = styles[status];
  return (
    <span
      className={cn(
        'text-small inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold',
        s.fill,
        s.text,
        className,
      )}
    >
      <s.Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </span>
  );
}

export function StatusBanner({
  status,
  title,
  description,
  action,
}: {
  status: Exclude<HealthStatus, 'safe'> | 'action_required';
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const s = styles[status];
  return (
    <div
      className={cn('rounded-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center', s.fill)}
      role="status"
    >
      <s.Icon className={cn('h-5 w-5 shrink-0', s.text)} aria-hidden="true" />
      <div className="flex-1">
        <p className="text-ink font-semibold">{title}</p>
        {description ? <p className="text-small text-ink-soft">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
