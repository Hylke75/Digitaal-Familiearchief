/**
 * @dla/i18n — single source of truth for locales and UI messages.
 * The Next.js app feeds these dictionaries into next-intl. Keeping them in a
 * package (not inside the app) lets other surfaces (future mobile, emails)
 * reuse the same copy and keeps strings out of components.
 */
import nl from './messages/nl';
import en from './messages/en';
import type { AppMessages } from './messages/shape';

export const locales = ['nl-NL', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'nl-NL';

/** Message shape is defined by the Dutch dictionary; other locales must match it. */
export type Messages = AppMessages;
export type { AppMessages };

const dictionaries: Record<Locale, Messages> = {
  'nl-NL': nl,
  en,
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Resolve an arbitrary string (cookie / Accept-Language) to a supported locale. */
export function resolveLocale(input: string | undefined | null): Locale {
  if (!input) return defaultLocale;
  if (isLocale(input)) return input;
  const base = input.split('-')[0]?.toLowerCase();
  if (base === 'nl') return 'nl-NL';
  if (base === 'en') return 'en';
  return defaultLocale;
}

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}
