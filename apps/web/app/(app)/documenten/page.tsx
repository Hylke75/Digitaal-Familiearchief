import { getTranslations } from 'next-intl/server';
import { ArchiveList } from '@/components/archive/ArchiveList';

export default async function DocumentsPage() {
  const t = await getTranslations();
  return (
    <ArchiveList
      type="document"
      title={t('nav.documents')}
      emptyTitle={t('emptyStates.documentsTitle')}
      emptyBody={t('emptyStates.documentsBody')}
    />
  );
}
