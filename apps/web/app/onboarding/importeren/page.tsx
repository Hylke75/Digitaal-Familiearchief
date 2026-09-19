import { getTranslations } from 'next-intl/server';
import { CheckCircle2 } from 'lucide-react';
import { ImportRunner } from '@/components/onboarding/ImportRunner';

// The mock import uploads ~150 small objects; allow a generous server budget.
export const maxDuration = 60;

export default async function OnboardingImportPage() {
  const t = await getTranslations('onboarding');

  return (
    <div className="space-y-6">
      <div className="text-success flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        <p className="font-semibold">{t('connectedTitle')}</p>
      </div>
      <p className="text-body text-ink-soft">{t('connectedBody')}</p>

      <div className="space-y-2">
        <h1 className="text-h2 text-ink">{t('importTitle')}</h1>
        <p className="text-body text-ink-soft">{t('importBody')}</p>
      </div>

      <ImportRunner />
    </div>
  );
}
