import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { BookOpen, Clock } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { Timeline } from '@/components/archive/Timeline';
import { listMedia } from '@/lib/archive/queries';
import { listChapters } from '@/lib/archive/chapters';

export default async function MyLifePage() {
  const locale = await getLocale();
  const tArchive = await getTranslations('archive');
  const tEmpty = await getTranslations('emptyStates');
  const tSources = await getTranslations('sources');
  const tChapters = await getTranslations('chapters');
  const [{ items, hasMore }, chapters] = await Promise.all([
    listMedia({ visualOnly: true }),
    listChapters(),
  ]);
  const timelineChapters = chapters.map((c) => ({
    id: c.id,
    title: c.title,
    startsOn: c.startsOn,
    endsOn: c.endsOn,
    coverUrl: c.cover?.thumbUrl ?? null,
    coverId: c.cover?.id ?? null,
  }));

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <PageHeader title={tArchive('timelineTitle')} subtitle={tArchive('timelineSubtitle')} />
        {chapters.length > 0 ? (
          <Link
            href="/hoofdstukken"
            className="text-forest inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {tChapters('viewAll')}
          </Link>
        ) : null}
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-8 w-8" aria-hidden="true" />}
          title={tEmpty('timelineTitle')}
          description={tEmpty('timelineBody')}
          action={<ButtonLink href="/bronnen">{tSources('connect')}</ButtonLink>}
        />
      ) : (
        <Timeline
          initial={items}
          hasMore={hasMore}
          locale={locale}
          labels={{
            loadMore: tArchive('loadMore'),
            loading: tArchive('loading'),
            unknownDate: tArchive('unknownDate'),
          }}
          chapters={timelineChapters}
        />
      )}
    </div>
  );
}
