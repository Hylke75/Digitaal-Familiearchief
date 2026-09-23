import { cn } from '@/lib/cn';

/** Accessible labelled input (docs/DESIGN.md §52 — semantic forms, focus states). */
export function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  required,
  hint,
  error,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
}) {
  const id = `field-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  // Screen readers announce the error/hint because they're linked, and the
  // invalid state is exposed programmatically, not just via colour (WCAG 2.2 AA).
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
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
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'rounded-input border-border bg-surface text-body focus-visible:border-forest w-full border px-4 py-3 outline-none',
          error && 'border-danger focus-visible:border-danger',
        )}
      />
      {error ? (
        <p id={errorId} className="text-caption text-danger">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="text-caption text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
