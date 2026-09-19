/** Page header: title, optional subtitle, optional contextual action (docs/DESIGN.md §6). */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-h2 text-ink">{title}</h1>
        {subtitle ? <p className="text-body text-ink-soft mt-1">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
