import { getTranslations } from 'next-intl/server';
import { FileText } from 'lucide-react';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { ButtonLink } from '@/components/ui/Button';

export default async function DocumentsPage() {
  const t = await getTranslations();
  return (
    <PlaceholderScreen
      title={t('nav.documents')}
      icon={<FileText className="h-8 w-8" aria-hidden="true" />}
      emptyTitle={t('emptyStates.documentsTitle')}
      emptyBody={t('emptyStates.documentsBody')}
      action={<ButtonLink href="/bronnen">{t('emptyStates.documentsAction')}</ButtonLink>}
    />
  );
}
