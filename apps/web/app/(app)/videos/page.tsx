import { getTranslations } from 'next-intl/server';
import { ArchiveList } from '@/components/archive/ArchiveList';

export default async function VideosPage() {
  const t = await getTranslations();
  return (
    <ArchiveList
      type="video"
      title={t('nav.videos')}
      emptyTitle={t('emptyStates.genericTitle')}
      emptyBody={t('emptyStates.genericBody')}
    />
  );
}
