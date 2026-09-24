import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { CalendarHeart, Cake, Flower2, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { MediaGallery } from '@/components/archive/MediaGallery';
import { AutoRefreshImage } from '@/components/archive/AutoRefreshImage';
import { anniversariesForToday } from '@/lib/archive/anniversaries';

export const metadata = { title: 'Jubilea' };

/**
 * Alle jubilea van vandaag op één plek: beeldherinneringen per jaar (met plaats-
 * en datumkop), verjaardagen en gedenkdagen van personen, en jubilea van
 * gebeurtenissen. Rustige, terugblikkende pagina — geen statusrapport.
 */
export default async function AnniversariesPage() {
  const t = await getTranslations('anniversaries');
  const f = await getFormatter();
  const { photo, people, events } = await anniversariesForToday();

  const fullDate = (d: string) =>
    f.dateTime(new Date(d), { day: 'numeric', month: 'long', year: 'numeric' });

  const empty = photo.length === 0 && people.length === 0 && events.length === 0;

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {empty ? (
        <EmptyState
          icon={<Sparkles className="h-8 w-8" aria-hidden="true" />}
          title={t('empty')}
          description={t('emptyBody')}
        />
      ) : (
        <div className="space-y-10">
          {/* Beeldjubilea per jaar */}
          {photo.map((a) => (
            <section key={`photo-${a.yearsAgo}`}>
              <div className="mb-3">
                <h2 className="text-h3 text-ink">{t('todayYearsAgo', { count: a.yearsAgo })}</h2>
                <p className="text-small text-ink-soft mt-0.5">
                  {a.place ? `${a.place} · ${fullDate(a.date)}` : fullDate(a.date)}
                  {' · '}
                  {t('memoriesCount', { count: a.items.length })}
                </p>
              </div>
              <MediaGallery items={a.items} targetHeight={220} />
            </section>
          ))}

          {/* Personen */}
          {people.length > 0 ? (
            <section>
              <h2 className="text-h3 text-ink mb-3">{t('peopleTitle')}</h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {people.map((p) => (
                  <li key={`${p.kind}-${p.personId}`}>
                    <Link
                      href={`/personen/${p.personId}`}
                      className="border-border rounded-card hover:bg-warm flex items-center gap-3 border p-3"
                    >
                      <span className="bg-warm relative block h-14 w-14 shrink-0 overflow-hidden rounded-full">
                        {p.coverThumbUrl ? (
                          <AutoRefreshImage
                            itemId={p.personId}
                            src={p.coverThumbUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-ink-soft flex h-full w-full items-center justify-center">
                            {p.kind === 'birthday' ? (
                              <Cake className="h-6 w-6" aria-hidden="true" />
                            ) : (
                              <Flower2 className="h-6 w-6" aria-hidden="true" />
                            )}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="text-small text-forest flex items-center gap-1.5 font-medium">
                          {p.kind === 'birthday' ? (
                            <Cake className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Flower2 className="h-4 w-4" aria-hidden="true" />
                          )}
                          {p.kind === 'birthday' ? t('birthdayLabel') : t('memorialLabel')}
                        </span>
                        <span className="text-body text-ink mt-0.5 block truncate">{p.name}</span>
                        <span className="text-small text-ink-soft block">
                          {p.kind === 'birthday'
                            ? t('personAge', { count: p.yearsAgo })
                            : t('yearsAgo', { count: p.yearsAgo })}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Gebeurtenissen */}
          {events.length > 0 ? (
            <section>
              <h2 className="text-h3 text-ink mb-3">{t('eventsTitle')}</h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((e) => (
                  <li key={e.eventId}>
                    <Link
                      href={`/gebeurtenissen/${e.eventId}`}
                      className="border-border rounded-card group block overflow-hidden border"
                    >
                      <span className="bg-warm relative block aspect-[3/2] overflow-hidden">
                        {e.cover?.thumbUrl ? (
                          <AutoRefreshImage
                            itemId={e.cover.id}
                            src={e.cover.thumbUrl}
                            alt=""
                            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                          />
                        ) : (
                          <span className="text-ink-soft flex h-full w-full items-center justify-center">
                            <CalendarHeart className="h-8 w-8" aria-hidden="true" />
                          </span>
                        )}
                      </span>
                      <span className="block p-4">
                        <span className="text-small text-forest font-medium">
                          {t('todayYearsAgo', { count: e.yearsAgo })}
                        </span>
                        <span className="text-h4 text-ink mt-0.5 block truncate">{e.title}</span>
                        <span className="text-small text-ink-soft block">{fullDate(e.date)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
