import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Sparkles } from 'lucide-react';

/**
 * A prominent conversion moment shown at the bottom of the content for demo
 * visitors. The banner at the top is easy to scroll past; this is the calm,
 * on-brand invitation to start their own archive once they've seen what it does.
 */
export async function DemoCTA() {
  const t = await getTranslations('demo');
  return (
    <section className="bg-forest rounded-card mt-10 px-6 py-8 text-white sm:px-8 sm:py-10">
      <div className="mx-auto max-w-2xl text-center">
        <Sparkles className="mx-auto mb-3 h-6 w-6 text-white/80" aria-hidden="true" />
        <h2 className="text-h3 font-semibold">{t('ctaTitle')}</h2>
        <p className="text-body mx-auto mt-2 max-w-xl text-white/85">{t('ctaBody')}</p>
        <Link
          href="/registreren"
          className="rounded-button text-forest focus-visible:ring-forest mt-5 inline-flex items-center gap-2 bg-white px-5 py-2.5 font-semibold hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--forest,#18392F)]"
        >
          {t('ctaButton')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
