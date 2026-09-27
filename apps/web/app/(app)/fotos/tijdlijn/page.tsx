import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { SubNav, PHOTO_SUBNAV } from '@/components/demo/SubNav';
import { PhotoGrid } from '@/components/demo/PhotoGrid';
import { isDemo } from '@/lib/demo/mode';
import { demoPhotos } from '@/lib/demo/data';
import { buildTimeline } from '@/lib/demo/queries';

export default function TimelinePage() {
  if (!isDemo()) notFound();

  const timeline = buildTimeline();

  return (
    <div>
      <PageHeader title="Tijdlijn" subtitle={`${demoPhotos.length} foto's door de jaren heen`} />
      <SubNav items={PHOTO_SUBNAV} />

      {/* Jaar-sprongbalk */}
      <nav aria-label="Spring naar jaar" className="-mx-1 mb-6 overflow-x-auto">
        <ul className="flex min-w-max gap-1 px-1">
          {timeline.map((y) => (
            <li key={y.year}>
              <a
                href={`#jaar-${y.year}`}
                className="text-small border-border text-ink-soft hover:bg-warm hover:text-ink bg-surface inline-flex items-center rounded-full border px-4 py-2 font-semibold transition-colors"
              >
                {y.year}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-12">
        {timeline.map((y) => (
          <section key={y.year} id={`jaar-${y.year}`} className="scroll-mt-24">
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="text-h2 text-ink">{y.year}</h2>
              <span className="text-small text-ink-soft">{y.count} foto&apos;s</span>
            </div>

            <div className="space-y-8">
              {y.months.map((m) => (
                <div key={m.key}>
                  <p className="text-caption text-brass mb-3 font-semibold tracking-wide">
                    {m.label}
                  </p>
                  <div className="space-y-5">
                    {m.days.map((d) => (
                      <div key={d.key}>
                        <p className="text-small text-ink-soft mb-2">{d.label}</p>
                        <PhotoGrid photos={d.items} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
