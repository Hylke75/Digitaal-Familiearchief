'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { runMockImportAction, type ImportActionState } from '@/lib/archive/actions';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

function StartButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('onboarding');
  return (
    <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
      {pending ? t('importing') : t('importStart')}
    </Button>
  );
}

export function ImportRunner() {
  const t = useTranslations('onboarding');
  const nf = new Intl.NumberFormat('nl-NL');
  const [state, formAction] = useFormState<ImportActionState, FormData>(runMockImportAction, {});

  if (state.done) {
    const total = (state.archived ?? 0) + (state.deduped ?? 0);
    return (
      <Card>
        <CardBody className="space-y-4 text-center">
          <span className="bg-soft-green text-success mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="text-h3 text-ink">{t('successTitle')}</h2>
          <p className="text-body text-ink-soft">{t('successBody', { count: nf.format(total) })}</p>
          {state.deduped ? (
            <p className="text-small text-ink-soft">
              {t('successDeduped', { count: nf.format(state.deduped) })}
            </p>
          ) : null}
          <ButtonLink href="/vandaag" size="lg">
            {t('viewArchive')}
          </ButtonLink>
        </CardBody>
      </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <p role="alert" className="rounded-input bg-soft-red text-small text-danger px-3 py-2">
          {t('importError')}
        </p>
      ) : null}
      <StartButton />
    </form>
  );
}
