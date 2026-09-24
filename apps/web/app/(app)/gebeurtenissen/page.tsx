import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { CalendarHeart } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { AutoRefreshImage } from '@/components/archive/AutoRefreshImage';
import { listEvents } from '@/lib/archive/events';
import { createEventAction } from '@/lib/archive/events-actions';

export const metadata = { title: 'Gedeelde gebeurtenissen' };

/**
 * Overzicht van gedeelde gebeurtenissen: een dag of feest waar meerdere mensen
 * foto's van hebben. Bovenaan een klein formulier om er een te beginnen; daaronder
 * de bestaande, met een teller die verklikt of er iets op goedkeuring wacht.
 */
export default async function EventsPage() {
  const t = await getTranslations('events');
  const f = await getFormatter();
  const events = await listEvents();

  const day = (d: string | null) =>
    d ? f.dateTime(new Date(d), { day: 'numeric', month: 'long', year: 'numeric' }) : t('noDate');

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <form
        action={createEventAction}
        className="border-border rounded-card mb-8 flex flex-col gap-3 border p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="title" className="text-small text-ink mb-1 block font-medium">
            {t('titleLabel')}
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder={t('titlePlaceholder')}
            className="border-border rounded-button text-body focus:border-forest w-full border px-4 py-2.5 outline-none"
          />
        </div>
        <div>
          <label htmlFor="happenedOn" className="text-small text-ink mb-1 block font-medium">
            {t('dateLabel')}
          </label>
          <input
            id="happenedOn"
            name="happenedOn"
            type="date"
            className="border-border rounded-button text-body focus:border-forest border px-4 py-2.5 outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-button bg-forest text-body px-5 py-2.5 font-medium text-white"
        >
          {t('create')}
        </button>
      </form>

      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarHeart className="h-8 w-8" aria-hidden="true" />}
          title={t('empty')}
          description={t('emptyBody')}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <li key={e.id}>
              <Link
                href={`/gebeurtenissen/${e.id}`}
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
                  {e.pendingCount > 0 ? (
                    <span className="bg-forest text-small absolute right-2 top-2 rounded-full px-2.5 py-1 font-medium text-white">
                      {t('pendingBadge', { count: e.pendingCount })}
                    </span>
                  ) : null}
                </span>
                <span className="block p-4">
                  <span className="text-h4 text-ink block truncate">{e.title}</span>
                  <span className="text-small text-ink-soft mt-0.5 block">{day(e.happenedOn)}</span>
                  <span className="text-small text-ink-soft mt-1 block">
                    {t('approvedCount', { count: e.approvedCount })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
