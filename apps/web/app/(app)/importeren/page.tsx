import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { ImportUploader } from '@/components/import/ImportUploader';

// Parsing + uploading an export archive can take a while; allow a generous budget.
export const maxDuration = 60;

export default async function ImportPage() {
  const t = await getTranslations('imports');
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t('title')} subtitle={t('intro')} />
      <ImportUploader />
    </div>
  );
}
