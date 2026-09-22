import { getLocale, getTranslations } from 'next-intl/server';
import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { ArchiveGrid } from '@/components/archive/ArchiveGrid';
import { listMedia, type ArchiveItemType } from '@/lib/archive/queries';

/**
 * Archive browser for one item type (foto/video/document). Reads the first page
 * under RLS and hands off to the client infinite-scroll grid.
 */
export async function ArchiveTypeView({
  type,
  title,
  emptyTitle,
  emptyBody,
}: {
  type: ArchiveItemType;
  title: string;
  emptyTitle: string;
  emptyBody: string;
}) {
  const locale = await getLocale();
  const tArchive = await getTranslations('archive');
  const tSources = await getTranslations('sources');
  const { items, hasMore } = await listMedia({ type });

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={
          !hasMore && items.length > 0 ? tArchive('memories', { count: items.length }) : undefined
        }
      />
      {items.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" aria-hidden="true" />}
          title={emptyTitle}
          description={emptyBody}
          action={<ButtonLink href="/bronnen">{tSources('connect')}</ButtonLink>}
        />
      ) : (
        <ArchiveGrid
          initial={items}
          hasMore={hasMore}
          type={type}
          locale={locale}
          loadMoreLabel={tArchive('loadMore')}
          loadingLabel={tArchive('loading')}
        />
      )}
    </div>
  );
}
