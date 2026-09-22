import { getTranslations } from 'next-intl/server';
import { ArchiveTypeView } from '@/components/archive/ArchiveTypeView';

export default async function PhotosPage() {
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
