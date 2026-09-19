import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Placeholder source "logo" — a calm monogram tile. Real official platform logos
 * (per brand guidelines, docs/DESIGN.md §57) replace this in a later pass.
 */
export function SourceLogo({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'bg-warm text-body text-forest inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] font-semibold',
        className,
      )}
      aria-hidden="true"
    >
      {name.charAt(0)}
    </span>
  );
}

export function ConnectedSourceRow({
  name,
  statusLabel,
  updatedLabel,
  itemsLabel,
}: {
  name: string;
  statusLabel: string;
  updatedLabel: string;
  itemsLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <SourceLogo name={name} />
      <div className="min-w-0 flex-1">
        <p className="text-ink truncate font-semibold">{name}</p>
        <p className="text-small text-ink-soft flex items-center gap-1.5">
          <CheckCircle2 className="text-success h-4 w-4" aria-hidden="true" />
          {statusLabel} · {updatedLabel}
        </p>
      </div>
      <span className="text-small text-ink-soft shrink-0">{itemsLabel}</span>
    </div>
  );
}
