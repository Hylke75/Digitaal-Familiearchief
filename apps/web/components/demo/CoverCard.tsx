import Link from 'next/link';

/** A cover tile (album/place/person). Image dominates; label sits below (§53). */
export function CoverCard({
  href,
  coverUrl,
  title,
  subtitle,
  sources,
}: {
  href: string;
  coverUrl: string | null;
  title: string;
  subtitle?: string;
  sources?: string[];
}) {
  return (
    <Link
      href={href}
      className="focus-visible:ring-forest rounded-card group block focus-visible:outline-none focus-visible:ring-2"
    >
      <div className="rounded-card bg-warm aspect-[4/3] w-full overflow-hidden">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="mt-2">
        <p className="text-body text-ink truncate font-semibold">{title}</p>
        {subtitle ? <p className="text-small text-ink-soft">{subtitle}</p> : null}
        {sources && sources.length ? (
          <p className="text-caption text-ink-soft mt-0.5 truncate">{sources.join(' · ')}</p>
        ) : null}
      </div>
    </Link>
  );
}
