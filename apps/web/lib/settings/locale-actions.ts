'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

/**
 * Set the interface language. The locale lives in a cookie (i18n/request.ts
 * reads it), so we write it here and revalidate the whole tree so every server
 * component re-renders in the chosen language. Only the supported locales are
 * accepted.
 */
export async function setLocaleAction(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? '');
  if (locale !== 'nl' && locale !== 'en') return;
  cookies().set('LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  revalidatePath('/', 'layout');
}
