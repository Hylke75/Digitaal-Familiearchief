import { cn } from '@/lib/cn';

/** Accessible labelled input (docs/DESIGN.md §52 — semantic forms, focus states). */
export function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  required,
  hint,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  const id = `field-${name}`;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="text-small text-ink block font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="rounded-input border-border bg-surface text-body focus-visible:border-forest w-full border px-4 py-3 outline-none"
      />
      {hint ? <p className="text-caption text-ink-soft">{hint}</p> : null}
    </div>
  );
}
