import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { ScanCapture } from '@/components/scan/ScanCapture';

export const metadata = { title: 'Scannen' };

/**
 * Scannen — papieren en oude foto's digitaliseren met de camera of een bestand.
 * Bijsnijden en rechtzetten gebeurt in de browser; de nette uitsnede komt als
 * gewone herinnering in het archief, onder de bron "Scan".
 */
export default async function ScanPage() {
  const t = await getTranslations('scan');
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <ScanCapture />
    </div>
  );
}
