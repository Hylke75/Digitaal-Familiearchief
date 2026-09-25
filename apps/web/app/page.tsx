import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check, Download, Lock, Layers, Clock } from 'lucide-react';
import { CONNECTOR_REGISTRY, type ConnectorCapability } from '@dla/connectors';
import { BRAND } from '@dla/shared';
import { demoEnabled } from '@/lib/demo-account';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Logo } from '@/components/brand/Logo';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { ProductPreview } from '@/components/marketing/ProductPreview';
import { SourceLogo } from '@/components/marketing/SourceLogo';
import { getAssistedGuide } from '@/lib/connectors/assisted';
import { marketingNl as m } from '@/content/marketing.nl';
import { PRICING_DECIDED, PRICING_PLANS } from '@/config/pricing';
import { TRUST_FACTS } from '@/config/trust';

export const metadata: Metadata = {
  title: 'Bewora — Bewaar je digitale leven onafhankelijk',
  description:
    "Koppel je foto's, sociale media en documenten. Bewora brengt je digitale leven samen in een onafhankelijk archief dat van jou blijft.",
};

/** Consumer-friendly capability label, derived from the connector registry (§16). */
function capabilityLabel(c: ConnectorCapability): string {
  if (getAssistedGuide(c.connectorKey)) return 'Koppelen';
  switch (c.connectionType) {
    case 'device_native':
      return 'Binnenkort';
    case 'archive_import':
    case 'guided_export':
      return 'Importeren';
    case 'user_picker':
      return 'Selecteren';
    default:
      return c.type === 'live' || c.type === 'portability' ? 'Automatisch' : 'Binnenkort';
  }
}

const PLATFORM_ORDER = [
  'apple_photos',
  'google_photos',
  'google_drive',
  'onedrive',
  'dropbox',
  'instagram',
  'facebook',
  'whatsapp',
  'tiktok',
];

const PLATFORMS = PLATFORM_ORDER.map((key) =>
  CONNECTOR_REGISTRY.find((c) => c.connectorKey === key),
).filter((c): c is ConnectorCapability => Boolean(c));

export default async function HomePage() {
  const tDemo = await getTranslations('demo');
  return (
    <div className="bg-warm min-h-dvh">
      <SiteHeader />

      {/* 1 — Hero */}
      <section className="max-w-content mx-auto grid items-center gap-12 px-6 pb-16 pt-12 sm:pt-16 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="text-forest text-small font-semibold uppercase tracking-wide">
            {BRAND.descriptorNl}
          </p>
          <h1 className="text-ink text-balance text-[2.5rem] font-semibold leading-[1.08] tracking-tight sm:text-[3.25rem]">
            {m.hero.headline[0]}
            <br />
            {m.hero.headline[1]}
            <br />
            <span className="text-forest">{m.hero.headline[2]}</span>
          </h1>
          <p className="text-body-lg text-ink-soft max-w-xl text-balance">{m.hero.body}</p>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/registreren" size="lg">
              {m.nav.cta}
            </ButtonLink>
            {demoEnabled() ? (
              <ButtonLink href="/api/demo/enter" variant="secondary" size="lg">
                {tDemo('tryButton')}
              </ButtonLink>
            ) : (
              <a href="#hoe" className="text-forest inline-flex items-center gap-1.5 font-medium">
                {m.nav.ctaSecondary}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
          <p className="text-ink-soft text-small">{m.hero.note}</p>
        </div>
        <ProductPreview variant="dashboard" className="lg:max-w-md lg:justify-self-end" />
      </section>

      {/* 2 — Platform recognition */}
      <section id="bronnen" className="max-w-content mx-auto px-6 py-8">
        <p className="text-ink-soft text-small mx-auto max-w-2xl text-center">
          {m.platforms.heading}
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {PLATFORMS.map((c) => (
            <li
              key={c.connectorKey}
              className="border-border bg-surface text-ink text-small inline-flex items-center gap-2 rounded-full border px-3.5 py-2"
            >
              <SourceLogo connectorKey={c.connectorKey} fallback={c.displayName} />
              {c.displayName}
              <span className="text-ink-soft border-border text-caption ml-1 border-l pl-2">
                {capabilityLabel(c)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 3 — Product proof */}
      <section className="max-w-content mx-auto grid items-center gap-12 px-6 py-16 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <ProductPreview variant="timeline" className="lg:max-w-md" />
        </div>
        <div className="order-1 space-y-4 lg:order-2">
          <SectionKicker icon={<Layers className="h-4 w-4" />}>Product</SectionKicker>
          <h2 className="text-h2 text-ink text-balance">{m.productProof.heading}</h2>
          <p className="text-body-lg text-ink-soft max-w-xl">{m.productProof.body}</p>
          <ButtonLink href="/registreren" variant="secondary" size="md">
            {m.nav.cta}
          </ButtonLink>
        </div>
      </section>

      {/* 4 — How it works */}
      <section id="hoe" className="bg-surface border-border border-y">
        <div className="max-w-content mx-auto px-6 py-20">
          <h2 className="text-h2 text-ink mb-3">{m.how.heading}</h2>
          <p className="text-ink-soft text-small mb-10">{m.how.note}</p>
          <ol className="grid gap-5 sm:grid-cols-3">
            {m.how.steps.map((step, i) => (
              <li key={step.title}>
                <Card className="h-full">
                  <CardBody className="space-y-3">
                    <span className="bg-forest text-small inline-flex h-9 w-9 items-center justify-center rounded-full font-semibold text-white">
                      {i + 1}
                    </span>
                    <h3 className="text-h3 text-ink">{step.title}</h3>
                    <p className="text-body text-ink-soft">{step.body}</p>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5 — What Bewora preserves */}
      <section id="bewaart" className="max-w-content mx-auto px-6 py-20">
        <h2 className="text-h2 text-ink mb-8">{m.preserve.heading}</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {m.preserve.groups.map((g) => (
            <Card key={g.title} className="h-full">
              <CardBody className="space-y-2">
                <h3 className="text-h3 text-ink">{g.title}</h3>
                <p className="text-body text-ink-soft">{g.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* 6 — Timeline experience */}
      <section className="bg-forest text-white">
        <div className="max-w-content mx-auto grid items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div className="space-y-4">
            <SectionKicker icon={<Clock className="h-4 w-4" />} tone="dark">
              Mijn leven
            </SectionKicker>
            <h2 className="text-h2 text-balance font-semibold">{m.timeline.heading}</h2>
            <p className="text-body-lg max-w-xl text-white/80">{m.timeline.body}</p>
            <Timeline />
          </div>
          <ProductPreview variant="timeline" className="lg:max-w-md lg:justify-self-end" />
        </div>
      </section>

      {/* 7 — Ownership + export */}
      <section id="eigenaarschap" className="max-w-content mx-auto px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-5">
            <SectionKicker icon={<Download className="h-4 w-4" />}>Eigenaarschap</SectionKicker>
            <h2 className="text-h2 text-ink text-balance">{m.ownership.heading}</h2>
            <p className="text-body-lg text-ink-soft max-w-xl">{m.ownership.body}</p>
            <ul className="space-y-3">
              {m.ownership.points.map((p) => (
                <li key={p} className="text-body text-ink flex items-start gap-3">
                  <Check className="text-brass mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <Card className="self-start">
            <CardBody className="space-y-3 sm:p-8">
              <h3 className="text-h3 text-ink">{m.ownership.stops.heading}</h3>
              <p className="text-body text-ink-soft">{m.ownership.stops.body}</p>
              <p className="text-ink-soft border-border text-small mt-2 border-t pt-4">
                Je originele bestanden zijn nu al te downloaden. Een volledige export van je hele
                archief in één keer is in ontwikkeling.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* 8 — Family */}
      <section id="families" className="bg-surface border-border border-y">
        <div className="max-w-content mx-auto px-6 py-20">
          <div className="max-w-3xl">
            <h2 className="text-h2 text-ink text-balance">
              {m.family.heading[0]}
              <br />
              <span className="text-ink-soft">{m.family.heading[1]}</span>
            </h2>
            <p className="text-body-lg text-ink-soft mt-4">{m.family.body}</p>
            <p className="text-body text-ink mt-4 max-w-2xl">{m.family.secondary}</p>
          </div>
          <Card className="mt-8 max-w-2xl">
            <CardBody className="space-y-2">
              <h3 className="text-h3 text-ink">{m.family.passOn.heading}</h3>
              <p className="text-body text-ink-soft">{m.family.passOn.body}</p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* 9 — Independence (result model, no ✓ next to problems) */}
      <section className="max-w-content mx-auto px-6 py-20">
        <h2 className="text-h2 text-ink mb-8 max-w-2xl text-balance">{m.independence.heading}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {m.independence.results.map((r) => (
            <div
              key={r.event}
              className="rounded-card border-border bg-surface flex items-center gap-4 border p-5"
            >
              <span className="text-ink text-small flex-1">{r.event}</span>
              <ArrowRight className="text-brass h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-forest text-small flex-1 font-medium">{r.result}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 10 — Trust (product-proof-first, config-driven, no fabricated proof) */}
      <section id="veiligheid" className="bg-surface border-border border-y">
        <div className="max-w-content mx-auto px-6 py-20">
          <h2 className="text-h2 text-ink mb-3">{m.trust.heading}</h2>
          <p className="text-ink-soft text-small mb-8 max-w-xl">{m.trust.body}</p>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_FACTS.map((f) => (
              <div key={f.label} className="rounded-card border-border bg-warm border p-5">
                <dt className="text-ink-soft text-caption">{f.label}</dt>
                <dd className="text-ink text-small mt-1 font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-ink-soft text-caption mt-6">
            <Lock className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            We tonen alleen wat we kunnen onderbouwen. Geen verzonnen cijfers, keurmerken of
            reviews.
          </p>
        </div>
      </section>

      {/* 11 — Pricing (no invented amounts) */}
      <section id="prijzen" className="max-w-content mx-auto px-6 py-20">
        <h2 className="text-h2 text-ink mb-8">{m.pricing.heading}</h2>
        {PRICING_DECIDED ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
            {PRICING_PLANS.map((plan) => (
              <Card key={plan.id} className={plan.featured ? 'ring-forest ring-2' : undefined}>
                <CardBody className="space-y-3">
                  <h3 className="text-h3 text-ink">{plan.name}</h3>
                  <p className="text-ink text-h2">
                    {plan.monthlyPrice !== null ? `€${plan.monthlyPrice}` : '—'}
                    <span className="text-ink-soft text-small font-normal"> /maand</span>
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feat) => (
                      <li key={feat} className="text-ink text-small flex items-start gap-2">
                        <Check className="text-forest mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink href="/registreren" size="md" className="w-full justify-center">
                    {m.nav.cta}
                  </ButtonLink>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-xl">
            <CardBody className="space-y-4 sm:p-8">
              <p className="text-body text-ink-soft">{m.pricing.undecidedBody}</p>
              <ButtonLink href="/registreren" size="lg">
                {m.nav.cta}
              </ButtonLink>
            </CardBody>
          </Card>
        )}
      </section>

      {/* 12 — FAQ (accessible <details> accordion) */}
      <section id="faq" className="bg-surface border-border border-t">
        <div className="max-w-content mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-h2 text-ink mb-8">{m.faq.heading}</h2>
          <div className="divide-border border-border divide-y border-y">
            {m.faq.items.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="text-ink flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ArrowRight
                    className="text-ink-soft h-4 w-4 shrink-0 transition-transform group-open:rotate-90"
                    aria-hidden="true"
                  />
                </summary>
                <p className="text-body text-ink-soft mt-3">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 13 — Final CTA */}
      <section className="bg-forest text-white">
        <div className="max-w-content mx-auto px-6 py-20 text-center">
          <Logo variant="icon" theme="dark" size="lg" className="mx-auto mb-5" />
          <h2 className="text-h2 mx-auto max-w-2xl text-balance font-semibold">
            {m.finalCta.heading}
          </h2>
          <p className="text-body-lg mx-auto mt-3 max-w-xl text-white/80">{m.finalCta.body}</p>
          <div className="mt-8">
            <ButtonLink
              href="/registreren"
              size="lg"
              className="!text-forest bg-white hover:bg-white/90"
            >
              {m.nav.cta}
            </ButtonLink>
          </div>
          <p className="text-small mt-6 text-white/70">{BRAND.taglineEn}</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SectionKicker({
  icon,
  children,
  tone = 'light',
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  tone?: 'light' | 'dark';
}) {
  return (
    <span
      className={
        tone === 'dark'
          ? 'text-caption inline-flex items-center gap-2 font-semibold uppercase tracking-wide text-white/70'
          : 'text-brass text-caption inline-flex items-center gap-2 font-semibold uppercase tracking-wide'
      }
    >
      {icon}
      {children}
    </span>
  );
}

/** The recurring time/timeline motif (docs/BRAND.md §34). */
function Timeline() {
  const years = ['2011', '2015', '2020', '2026'];
  return (
    <ul className="mt-4 space-y-2" aria-hidden="true">
      {years.map((y) => (
        <li key={y} className="flex items-center gap-3">
          <span className="text-caption w-10 tabular-nums text-white/70">{y}</span>
          <span className="h-px flex-1 bg-white/20" />
          <span className="bg-brass h-2 w-2 rounded-full" />
        </li>
      ))}
    </ul>
  );
}
