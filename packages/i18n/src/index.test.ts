import { describe, expect, it } from 'vitest';
import { defaultLocale, getMessages, locales, resolveLocale } from './index';

describe('@dla/i18n', () => {
  it('defaults to Dutch', () => {
    expect(defaultLocale).toBe('nl-NL');
  });

  it('resolves language tags to supported locales', () => {
    expect(resolveLocale('nl')).toBe('nl-NL');
    expect(resolveLocale('en-GB')).toBe('en');
    expect(resolveLocale('fr')).toBe('nl-NL');
    expect(resolveLocale(undefined)).toBe('nl-NL');
  });

  it('keeps every locale structurally complete', () => {
    const nlKeys = JSON.stringify(Object.keys(getMessages('nl-NL')).sort());
    for (const locale of locales) {
      expect(JSON.stringify(Object.keys(getMessages(locale)).sort())).toBe(nlKeys);
    }
  });
});
