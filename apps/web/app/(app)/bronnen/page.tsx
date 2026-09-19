import { getFormatter, getTranslations } from 'next-intl/server';
import { CONNECTOR_REGISTRY, onboardingAction } from '@dla/connectors';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConnectedSourceRow, SourceLogo } from '@/components/ui/SourceCard';
import { MOCK_SOURCES } from '@/lib/mock-dashboard';

export default async function SourcesPage() {
  const t = await getTranslations('sources');
  const tActions = await getTranslations('actions');
  const f = await getFormatter();

  // "Not connected yet" is generated from the honest capability registry.
  // Actions map from declared capability, so an unverified provider never shows
  // a real "Koppelen" (docs/DESIGN.md §12, CLAUDE.md §15).
  const connectedKeys = new Set(MOCK_SOURCES.map((s) => s.connectorKey));
  const available = CONNECTOR_REGISTRY.filter(
    (c) => c.connectorKey !== 'mock' && !connectedKeys.has(c.connectorKey),
  );

  const actionLabel = (action: string) =>
    action === 'connect'
      ? tActions('connect')
      : action === 'import'
        ? tActions('import')
        : tActions('comingSoon');

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <section className="mb-8">
        <h2 className="text-h3 text-ink mb-3">{t('connected')}</h2>
        <Card>
          <CardBody className="py-2">
            <ul className="divide-border divide-y">
              {MOCK_SOURCES.map((s) => (
                <li key={s.connectorKey}>
                  <ConnectedSourceRow
                    name={s.displayName}
                    statusLabel={t('allSafe')}
                    updatedLabel={s.updated === 'today' ? t('updatedToday') : t('updatedYesterday')}
                    itemsLabel={t('items', { count: f.number(s.items) })}
                  />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>

      <section>
        <h2 className="text-h3 text-ink mb-3">{t('notConnected')}</h2>
        <Card>
          <CardBody className="py-2">
            <ul className="divide-border divide-y">
              {available.map((c) => {
                const action = onboardingAction(c);
                return (
                  <li key={c.connectorKey} className="flex items-center gap-3 py-3">
                    <SourceLogo name={c.displayName} />
                    <span className="text-ink min-w-0 flex-1 truncate font-semibold">
                      {c.displayName}
                    </span>
                    <Button
                      variant={action === 'coming_soon' ? 'ghost' : 'secondary'}
                      size="sm"
                      disabled={action === 'coming_soon'}
                    >
                      {actionLabel(action)}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
