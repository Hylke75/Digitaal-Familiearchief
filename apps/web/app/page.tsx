import { getTranslations } from 'next-intl/server';
import { Check, Link2, ShieldCheck, Sparkles } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

/**
 * Public homepage (docs/DESIGN.md §48–§52). Calm, human, trustworthy — photos
 * and memories, not servers or padlocks. Copy comes from @dla/i18n.
 */
export default async function HomePage() {
  const t = await getTranslations('landing');
  const tApp = await getTranslations('app');

  return (
    <div className="bg-warm min-h-dvh">
      {/* Top bar */}
      <header className="max-w-content mx-auto flex items-center justify-between px-6 py-5">
        <span className="text-h3 text-forest font-semibold">{tApp('name')}</span>
        <nav className="flex items-center gap-2">
          <ButtonLink href="/inloggen" variant="ghost" size="sm">
            {t('ctaSecondary')}
          </ButtonLink>
          <ButtonLink href="/vandaag" size="sm">
            {t('ctaPrimary')}
          </ButtonLink>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-content mx-auto px-6 pb-16 pt-10 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <h1 className="text-h1 text-ink text-balance sm:text-[3.25rem] sm:leading-[1.05]">
              {t('heroTitle')}
              <br />
              <span className="text-forest">{t('heroTitle2')}</span>
            </h1>
            <p className="text-body-lg text-ink-soft text-balance">{t('heroIntro')}</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/vandaag" size="lg">
                {t('ctaPrimary')}
              </ButtonLink>
              <ButtonLink href="#hoe" variant="secondary" size="lg">
                {t('ctaSecondary')}
              </ButtonLink>
            </div>
          </div>

          {/* Hero visual — a calm timeline suggestion, no servers/padlocks */}
          <div className="relative">
            <div className="rounded-modal from-forest to-forest-hover shadow-card aspect-[4/3] bg-gradient-to-br" />
            <Card className="absolute -bottom-5 left-5 right-5">
              <CardBody className="flex items-center gap-3 py-4">
                <span className="bg-soft-green text-success inline-flex h-9 w-9 items-center justify-center rounded-full">
                  <Check className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-small text-ink font-semibold">{t('footerNote')}</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="hoe" className="max-w-content mx-auto px-6 py-16">
        <h2 className="text-h2 text-ink mb-8">{t('howTitle')}</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Step
            n="1"
            icon={<Link2 className="h-5 w-5" />}
            title={t('how1Title')}
            body={t('how1Body')}
          />
          <Step
            n="2"
            icon={<ShieldCheck className="h-5 w-5" />}
            title={t('how2Title')}
            body={t('how2Body')}
          />
          <Step
            n="3"
            icon={<Sparkles className="h-5 w-5" />}
            title={t('how3Title')}
            body={t('how3Body')}
          />
        </div>
      </section>

      {/* Core proposition */}
      <section className="bg-forest py-20 text-white">
        <div className="max-w-content mx-auto px-6">
          <p className="text-h2 text-balance font-semibold">{t('propTitle')}</p>
          <p className="text-body-lg mt-4 max-w-2xl text-white/80">{t('propBody')}</p>
        </div>
      </section>

      {/* Independence */}
      <section className="max-w-content mx-auto px-6 py-16">
        <h2 className="text-h2 text-ink mb-6 text-balance">{t('independenceTitle')}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            t('independence1'),
            t('independence2'),
            t('independence3'),
            t('independence4'),
            t('independence5'),
          ].map((item) => (
            <li key={item} className="text-body text-ink flex items-center gap-3">
              <Check className="text-success h-5 w-5 shrink-0" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Family */}
      <section className="max-w-content mx-auto px-6 pb-24">
        <Card>
          <CardBody className="sm:p-10">
            <p className="text-h3 text-ink text-balance font-semibold">{t('familyTitle')}</p>
            <p className="text-body text-ink-soft mt-3 max-w-2xl">{t('familyBody')}</p>
            <div className="mt-6">
              <ButtonLink href="/vandaag" size="lg">
                {t('ctaPrimary')}
              </ButtonLink>
            </div>
          </CardBody>
        </Card>
      </section>

      <footer className="border-border border-t py-8">
        <p className="max-w-content text-small text-ink-soft mx-auto px-6">
          {tApp('name')} — {tApp('tagline')}
        </p>
      </footer>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="bg-soft-green text-forest inline-flex h-9 w-9 items-center justify-center rounded-full">
            {icon}
          </span>
          <span className="text-small text-ink-soft font-semibold">{n}</span>
        </div>
        <h3 className="text-h3 text-ink">{title}</h3>
        <p className="text-body text-ink-soft">{body}</p>
      </CardBody>
    </Card>
  );
}
