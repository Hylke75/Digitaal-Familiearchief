import { getFormatter, getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { HealthPill } from '@/components/ui/StatusBanner';
import { ButtonLink } from '@/components/ui/Button';
import { ConnectedSourceRow } from '@/components/ui/SourceCard';
import {
  MOCK_NEW_SINCE_LAST_VISIT,
  MOCK_SOURCES,
  MOCK_TOTALS,
  MOCK_USER,
} from '@/lib/mock-dashboard';

export default async function TodayPage() {
  const t = await getTranslations('dashboard');
  const tHealth = await getTranslations('health');
  const tSources = await getTranslations('sources');
  const f = await getFormatter();

  const n = (value: number) => f.number(value);

  return (
    <div className="space-y-8">
      {/* Greeting + trust indicator */}
      <div>
        <p className="text-body-lg text-ink-soft">
          {t('greetingMorning', { name: MOCK_USER.name })}
        </p>
        <div className="mt-2">
          <HealthPill status="safe" label={tHealth('safe')} />
        </div>
      </div>

      {/* The headline number (docs/DESIGN.md §16, §47) */}
      <Card>
        <CardBody className="text-center">
          <p className="text-forest text-[3.25rem] font-semibold leading-none sm:text-[4rem]">
            {n(MOCK_TOTALS.memories)}
          </p>
          <p className="text-body text-ink-soft mt-2">{t('memoriesSafe')}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-left sm:grid-cols-4">
            <Stat value={n(MOCK_TOTALS.photos)} label={t('breakdownPhotos')} />
            <Stat value={n(MOCK_TOTALS.videos)} label={t('breakdownVideos')} />
            <Stat value={n(MOCK_TOTALS.documents)} label={t('breakdownDocuments')} />
            <Stat value={n(MOCK_TOTALS.other)} label={t('breakdownOther')} />
          </dl>
        </CardBody>
      </Card>

      {/* On this day (emotional tile) */}
      <Card className="overflow-hidden">
        <div className="from-forest to-forest-hover flex aspect-[16/7] items-end bg-gradient-to-br p-6">
          <div className="text-white">
            <p className="text-small opacity-90">{t('recentYearsAgo', { years: 6 })}</p>
            <p className="text-h3 font-semibold">Madeira</p>
            <p className="text-small opacity-90">18 september 2020</p>
          </div>
        </div>
      </Card>

      {/* New since last visit */}
      <section>
        <h2 className="text-h3 text-ink mb-3">{t('newSinceLastVisit')}</h2>
        <div className="text-small text-ink-soft flex flex-wrap gap-3">
          <Pill>
            {n(MOCK_NEW_SINCE_LAST_VISIT.photos)} {t('breakdownPhotos')}
          </Pill>
          <Pill>
            {n(MOCK_NEW_SINCE_LAST_VISIT.videos)} {t('breakdownVideos')}
          </Pill>
          <Pill>
            {n(MOCK_NEW_SINCE_LAST_VISIT.documents)} {t('breakdownDocuments')}
          </Pill>
        </div>
      </section>

      {/* Sources */}
      <section>
        <h2 className="text-h3 text-ink mb-3">{t('sourcesTitle')}</h2>
        <Card>
          <CardBody className="py-2">
            <ul className="divide-border divide-y">
              {MOCK_SOURCES.map((s) => (
                <li key={s.connectorKey}>
                  <ConnectedSourceRow
                    name={s.displayName}
                    statusLabel={tSources('allSafe')}
                    updatedLabel={
                      s.updated === 'today'
                        ? tSources('updatedToday')
                        : tSources('updatedYesterday')
                    }
                    itemsLabel={tSources('items', { count: n(s.items) })}
                  />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <div className="mt-4">
          <ButtonLink href="/bronnen" variant="secondary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('addSource')}
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="text-h3 text-ink font-semibold">{value}</dt>
      <dd className="text-small text-ink-soft">{label}</dd>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="bg-surface shadow-soft rounded-full px-3 py-1">{children}</span>;
}
