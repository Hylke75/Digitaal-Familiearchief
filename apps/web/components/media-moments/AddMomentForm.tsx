'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useTranslations } from 'next-intl';
import {
  addMediaMomentAction,
  type ReferenceFormState,
} from '@/lib/beeld-en-geluid/references-actions';
import { SubmitButton } from '@/components/auth/SubmitButton';

const ERROR_KEY: Record<NonNullable<ReferenceFormState['error']>, string> = {
  invalidUrl: 'errorInvalidUrl',
  missingTitle: 'errorMissingTitle',
  invalidFragment: 'errorInvalidFragment',
  notAuthenticated: 'errorGeneric',
};

export function AddMomentForm() {
  const t = useTranslations('mediaMoments');
  const [state, formAction] = useFormState<ReferenceFormState, FormData>(addMediaMomentAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields after a successful save so the next moment starts fresh.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  const field =
    'rounded-input border-border bg-surface text-body focus-visible:border-forest w-full border px-4 py-3 outline-none';
  const label = 'text-small text-ink block font-semibold';

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="mm-url" className={label}>
          {t('urlLabel')}
        </label>
        <input
          id="mm-url"
          name="url"
          type="url"
          inputMode="url"
          required
          placeholder="https://schatkamer.beeldengeluid.nl/…"
          aria-invalid={state.error === 'invalidUrl' ? true : undefined}
          aria-describedby="mm-url-hint"
          className={field}
        />
        <p id="mm-url-hint" className="text-caption text-ink-soft">
          {t('urlHint')}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="mm-title" className={label}>
          {t('titleLabel')}
        </label>
        <input
          id="mm-title"
          name="title"
          required
          placeholder={t('titlePlaceholder')}
          aria-invalid={state.error === 'missingTitle' ? true : undefined}
          className={field}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="mm-note" className={label}>
          {t('noteLabel')}
        </label>
        <textarea id="mm-note" name="note" rows={3} className={field} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="mm-broadcast" className={label}>
            {t('broadcastLabel')}
          </label>
          <input
            id="mm-broadcast"
            name="broadcastNote"
            placeholder={t('broadcastPlaceholder')}
            className={field}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="mm-start" className={label}>
            {t('fragmentStartLabel')}
          </label>
          <input
            id="mm-start"
            name="fragmentStart"
            inputMode="numeric"
            placeholder="17:28"
            aria-invalid={state.error === 'invalidFragment' ? true : undefined}
            className={field}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="mm-end" className={label}>
            {t('fragmentEndLabel')}
          </label>
          <input
            id="mm-end"
            name="fragmentEnd"
            inputMode="numeric"
            placeholder="18:40"
            aria-invalid={state.error === 'invalidFragment' ? true : undefined}
            className={field}
          />
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="rounded-input bg-soft-red text-small text-danger px-3 py-2">
          {t(ERROR_KEY[state.error])}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="rounded-input bg-soft-green text-small text-forest px-3 py-2">
          {t('savedBody')}
        </p>
      ) : null}

      <SubmitButton label={t('save')} />
      <p className="text-caption text-ink-soft">{t('linkOnlyNote')}</p>
    </form>
  );
}
