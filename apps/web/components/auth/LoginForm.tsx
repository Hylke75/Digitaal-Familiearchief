'use client';

import { useFormState } from 'react-dom';
import { useTranslations } from 'next-intl';
import { signInAction, type AuthState } from '@/lib/auth/actions';
import { Field } from './Field';
import { SubmitButton } from './SubmitButton';

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations('auth');
  const [state, formAction] = useFormState<AuthState, FormData>(signInAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field label={t('email')} name="email" type="email" autoComplete="email" required />
      <Field
        label={t('password')}
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {state.error ? (
        <p role="alert" className="rounded-input bg-soft-red text-small text-danger px-3 py-2">
          {t(state.error)}
        </p>
      ) : null}
      <SubmitButton label={t('login')} />
    </form>
  );
}
