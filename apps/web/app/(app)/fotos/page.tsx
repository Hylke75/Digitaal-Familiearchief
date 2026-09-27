import { getTranslations } from 'next-intl/server';
import { Images } from 'lucide-react';
import { ArchiveTypeView } from '@/components/archive/ArchiveTypeView';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SubNav, PHOTO_SUBNAV } from '@/components/demo/SubNav';
import { PhotoFilters } from '@/components/demo/PhotoFilters';
import { PhotoGrid } from '@/components/demo/PhotoGrid';
import { isDemo } from '@/lib/demo/mode';
import { demoPhotos } from '@/lib/demo/data';
import {
  queryPhotos,
  photoFilterFromParams,
  photoSortFromParams,
  photoSourceCards,
  availableYears,
  availablePlaces,
  peopleCards,
} from '@/lib/demo/queries';

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!isDemo()) {
    const t = await getTranslations();
    return (
      <ArchiveTypeView
        type="photo"
        title={t('nav.photos')}
        emptyTitle={t('emptyStates.photosTitle')}
        emptyBody={t('emptyStates.photosBody')}
      />
    );
  }

  const filter = photoFilterFromParams(searchParams);
  const sort = photoSortFromParams(searchParams);
  const photos = queryPhotos(filter, sort);

  return (
    <div>
      <PageHeader title="Foto's" subtitle={`${demoPhotos.length} foto's uit al je bronnen`} />
      <SubNav items={PHOTO_SUBNAV} />
      <PhotoFilters
        options={{
          sources: photoSourceCards().map((s) => ({ key: s.key, label: s.label })),
          years: availableYears(),
          places: availablePlaces(),
          people: peopleCards().map((p) => p.name),
        }}
      />
      <p className="text-small text-ink-soft mb-3">
        {photos.length} van {demoPhotos.length} foto&apos;s
      </p>
      {photos.length ? (
        <PhotoGrid photos={photos} />
      ) : (
        <EmptyState
          icon={<Images className="h-6 w-6" aria-hidden="true" />}
          title="Geen foto's gevonden"
          description="Pas je filters aan om meer te zien."
        />
      )}
    </div>
  );
}
