import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { getMessages, resolveLocale } from '@dla/i18n';

/**
 * next-intl request configuration. We do NOT use URL-prefixed routing yet; the
 * locale is resolved from a cookie (explicit user choice) and falls back to the
 * Accept-Language header, then to the Dutch default. This keeps the app
 * localisation-ready (CLAUDE.md §7) without committing to a routing scheme.
 */
export default getRequestConfig(async () => {
  const cookieLocale = cookies().get('LOCALE')?.value;
  const headerLocale = headers().get('accept-language') ?? undefined;
  const locale = resolveLocale(cookieLocale ?? headerLocale);

  return {
    locale,
    messages: getMessages(locale),
  };
});
