import { getTranslations } from 'next-intl/server';
import { ArchiveTypeView } from '@/components/archive/ArchiveTypeView';

export default async function VideosPage() {
  const t = await getTranslations();
  return (
    <ArchiveTypeView
      type="video"
      title={t('nav.videos')}
      emptyTitle={t('emptyStates.genericTitle')}
      emptyBody={t('emptyStates.genericBody')}
    />
  );
}
