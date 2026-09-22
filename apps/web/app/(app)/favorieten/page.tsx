import { getLocale, getTranslations } from 'next-intl/server';
import { Star } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { ArchiveGrid } from '@/components/archive/ArchiveGrid';
import { listFavourites } from '@/lib/archive/queries';

export default async function FavouritesPage() {
  const locale = await getLocale();
  const tArchive = await getTranslations('archive');
  const tEmpty = await getTranslations('emptyStates');
  const tNav = await getTranslations('nav');
  const { items, hasMore } = await listFavourites({});

  return (
    <div>
      <PageHeader title={tArchive('favouritesTitle')} />
      {items.length === 0 ? (
        <EmptyState
          icon={<Star className="h-8 w-8" aria-hidden="true" />}
          title={tEmpty('favouritesTitle')}
          description={tEmpty('favouritesBody')}
          action={<ButtonLink href="/mijn-leven">{tNav('myLife')}</ButtonLink>}
        />
      ) : (
        <ArchiveGrid
          initial={items}
          hasMore={hasMore}
          variant="favourites"
          locale={locale}
          loadMoreLabel={tArchive('loadMore')}
          loadingLabel={tArchive('loading')}
        />
      )}
    </div>
  );
}
