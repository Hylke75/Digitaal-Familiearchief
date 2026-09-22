import { getTranslations } from 'next-intl/server';
import { ArchiveTypeView } from '@/components/archive/ArchiveTypeView';

export default async function DocumentsPage() {
  const t = await getTranslations();
  return (
    <ArchiveTypeView
      type="document"
      title={t('nav.documents')}
      emptyTitle={t('emptyStates.documentsTitle')}
      emptyBody={t('emptyStates.documentsBody')}
    />
  );
}
