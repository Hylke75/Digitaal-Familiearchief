import { getTranslations } from 'next-intl/server';
import { ArchiveList } from '@/components/archive/ArchiveList';

export default async function PhotosPage() {
  const t = await getTranslations();
  return (
    <ArchiveList
      type="photo"
      title={t('nav.photos')}
      emptyTitle={t('emptyStates.photosTitle')}
      emptyBody={t('emptyStates.photosBody')}
    />
  );
}
