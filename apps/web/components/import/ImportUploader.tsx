'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Upload } from 'lucide-react';
import { importArchiveAction, type ImportState } from '@/lib/archive/import-actions';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

function UploadButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('imports');
  return (
    <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
      <Upload className="h-4 w-4" aria-hidden="true" />
      {pending ? t('importing') : t('upload')}
    </Button>
  );
}

export function ImportUploader() {
  const t = useTranslations('imports');
  const nf = new Intl.NumberFormat('nl-NL');
  const [state, formAction] = useFormState<ImportState, FormData>(importArchiveAction, {});

  if (state.done) {
    return (
      <Card>
        <CardBody className="space-y-4 text-center">
          <span className="bg-soft-green text-success mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="text-h3 text-ink">{t('resultTitle')}</h2>
          {(state.archived ?? 0) + (state.deduped ?? 0) === 0 ? (
            <p className="text-body text-ink-soft">{t('nothingFound')}</p>
          ) : (
            <p className="text-body text-ink-soft">
              {t('resultBody', {
                provider: state.provider ?? '',
                archived: nf.format(state.archived ?? 0),
                deduped: nf.format(state.deduped ?? 0),
              })}
            </p>
          )}
          <ButtonLink href="/vandaag" size="lg">
            {t('viewArchive')}
          </ButtonLink>
        </CardBody>
      </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <label className="rounded-card border-border bg-surface hover:bg-warm flex cursor-pointer flex-col items-center gap-2 border border-dashed px-6 py-12 text-center">
        <Upload className="text-forest/70 h-8 w-8" aria-hidden="true" />
        <span className="text-body text-ink-soft">{t('chooseFile')}</span>
        <input type="file" name="file" required className="sr-only" />
      </label>
      {state.error ? (
        <p role="alert" className="rounded-input bg-soft-red text-small text-danger px-3 py-2">
          {t('error')}
        </p>
      ) : null}
      <UploadButton />
    </form>
  );
}
