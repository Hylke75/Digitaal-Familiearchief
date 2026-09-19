'use client';

import { useFormState } from 'react-dom';
import { useTranslations } from 'next-intl';
import { signUpAction, type AuthState } from '@/lib/auth/actions';
import { Field } from './Field';
import { SubmitButton } from './SubmitButton';

export function RegisterForm() {
  const t = useTranslations('auth');
  const [state, formAction] = useFormState<AuthState, FormData>(signUpAction, {});

  if (state.status === 'check_email') {
    return (
      <div className="rounded-card bg-soft-green px-4 py-6 text-center">
        <h2 className="text-h3 text-ink">{t('checkEmailTitle')}</h2>
        <p className="text-body text-ink-soft mt-2">{t('checkEmailBody')}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('firstName')} name="first_name" autoComplete="given-name" required />
        <Field label={t('lastName')} name="last_name" autoComplete="family-name" required />
      </div>
      <Field label={t('email')} name="email" type="email" autoComplete="email" required />
      <Field
        label={t('password')}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint={t('passwordHint')}
      />
      {state.error ? (
        <p role="alert" className="rounded-input bg-soft-red text-small text-danger px-3 py-2">
          {t(state.error)}
        </p>
      ) : null}
      <SubmitButton label={t('createAccount')} />
    </form>
  );
}
