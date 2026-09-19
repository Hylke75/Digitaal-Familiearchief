import { getTranslations } from 'next-intl/server';
import { CONNECTOR_REGISTRY, onboardingAction } from '@dla/connectors';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ConnectedSourceRow, SourceLogo } from '@/components/ui/SourceCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';

const DISPLAY_NAME: Record<string, string> = { mock: 'Testbron' };

export default async function SourcesPage() {
  const t = await getTranslations('sources');
  const tActions = await getTranslations('actions');
  const tHealth = await getTranslations('health');

  const supabase = createClient();
  const { data: accounts } = await supabase
    .from('connector_accounts')
    .select('id, connector_key, display_name, last_successful_archive_at')
    .order('created_at', { ascending: true });

  const connectedKeys = new Set((accounts ?? []).map((a) => a.connector_key));
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
        {accounts && accounts.length > 0 ? (
          <Card>
            <CardBody className="py-2">
              <ul className="divide-border divide-y">
                {accounts.map((a) => (
                  <li key={a.id}>
                    <ConnectedSourceRow
                      name={a.display_name || DISPLAY_NAME[a.connector_key] || a.connector_key}
                      statusLabel={t('allSafe')}
                      updatedLabel={
                        a.last_successful_archive_at ? t('updatedToday') : tHealth('archiving')
                      }
                      itemsLabel=""
                    />
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : (
          <EmptyState
            title={t('subtitle')}
            description={t('notConnected')}
            action={<ButtonLink href="/onboarding">{t('connect')}</ButtonLink>}
          />
        )}
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
