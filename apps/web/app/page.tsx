import { getTranslations } from 'next-intl/server';

/**
 * Phase 0 landing page. Deliberately minimal — it proves the foundation works
 * end to end: workspace package consumption (@dla/i18n via next-intl),
 * localisation, Tailwind, and a clean production build. Real onboarding arrives
 * in Phase 3. Tone follows CLAUDE.md §54: calm, human, non-technical.
 */
export default async function HomePage() {
  const t = await getTranslations();

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          {t('app.name')}
        </p>
        <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">
          {t('landing.heading')}
        </h1>
        <p className="text-balance text-lg text-slate-600">{t('landing.intro')}</p>
      </div>

      <div className="flex flex-col items-start gap-4">
        <span
          className="inline-flex cursor-not-allowed items-center rounded-full bg-emerald-600/90 px-6 py-3 text-base font-medium text-white opacity-80"
          aria-disabled="true"
        >
          {t('landing.cta')}
        </span>
        <p className="text-sm text-slate-500">{t('landing.reassurance')}</p>
      </div>

      <footer className="mt-8 border-t border-slate-100 pt-6 text-sm text-slate-400">
        {t('app.tagline')}
      </footer>
    </main>
  );
}
