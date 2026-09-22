import { getLocale, getTranslations } from 'next-intl/server';
import { Clock } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { Timeline } from '@/components/archive/Timeline';
import { listMedia } from '@/lib/archive/queries';

export default async function MyLifePage() {
  const locale = await getLocale();
  const tArchive = await getTranslations('archive');
  const tEmpty = await getTranslations('emptyStates');
  const tSources = await getTranslations('sources');
  const { items, hasMore } = await listMedia({ visualOnly: true });

  return (
    <div>
      <PageHeader title={tArchive('timelineTitle')} subtitle={tArchive('timelineSubtitle')} />
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
        />
      )}
    </div>
  );
}
