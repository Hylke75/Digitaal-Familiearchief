import { getTranslations } from 'next-intl/server';
import {
  connectorsByCategory,
  onboardingAction,
  type ConnectorCapability,
  type OnboardingAction,
} from '@dla/connectors';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ConnectedSourceRow, SourceLogo } from '@/components/ui/SourceCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { createClient } from '@/lib/supabase/server';
import { isConnectProviderConfigured } from '@/lib/connectors/connect-registry';

const DISPLAY_NAME: Record<string, string> = { mock: 'Testbron' };
const CATEGORIES = [
  { key: 'photo_video', label: 'categoryPhotoVideo' },
  { key: 'social', label: 'categorySocial' },
  { key: 'documents', label: 'categoryDocuments' },
] as const;

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: { verbinden?: string };
}) {
  const t = await getTranslations('sources');
  const tActions = await getTranslations('actions');
  const tHealth = await getTranslations('health');

  const supabase = createClient();
  const { data: accounts } = await supabase
    .from('connector_accounts')
    .select('id, connector_key, display_name, last_successful_archive_at')
    .order('created_at', { ascending: true });

  const connectedKeys = new Set((accounts ?? []).map((a) => a.connector_key));

  const label = (action: OnboardingAction) => {
    switch (action) {
      case 'connect':
        return tActions('connect');
      case 'import':
        return tActions('import');
      case 'select':
        return t('select');
      case 'reconnect':
        return tActions('reconnect');
      default:
        return tActions('comingSoon');
    }
  };

  const renderSource = (c: ConnectorCapability) => {
    const action = onboardingAction(c);
    // A live OAuth connector that is fully implemented AND configured (client
    // credentials present) can be connected now, regardless of registry status.
    const liveConnectable = isConnectProviderConfigured(c.connectorKey);
    return (
      <li key={c.connectorKey} className="flex items-center gap-3 py-3">
        <SourceLogo name={c.displayName} />
        <div className="min-w-0 flex-1">
          <p className="text-ink truncate font-semibold">{c.displayName}</p>
          {c.description ? (
            <p className="text-small text-ink-soft truncate">{c.description}</p>
          ) : null}
        </div>
        {liveConnectable ? (
          <ButtonLink href={`/auth/${c.connectorKey}/start`} size="sm">
            {tActions('connect')}
          </ButtonLink>
        ) : action === 'import' ? (
          <ButtonLink
            href={`/importeren?connector=${c.connectorKey}`}
            variant="secondary"
            size="sm"
          >
            {label(action)}
          </ButtonLink>
        ) : (
          <Button
            variant={action === 'coming_soon' ? 'ghost' : 'secondary'}
            size="sm"
            disabled={action === 'coming_soon'}
          >
            {label(action)}
          </Button>
        )}
      </li>
    );
  };

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {searchParams.verbinden === 'gelukt' ? (
        <div className="mb-6">
          <StatusBanner
            status="archiving"
            title={t('allSafe')}
            description={tHealth('archiving')}
          />
        </div>
      ) : searchParams.verbinden === 'mislukt' ? (
        <div className="mb-6">
          <StatusBanner
            status="action_required"
            title={tActions('reconnect')}
            description={t('reconnect')}
          />
        </div>
      ) : null}

      {/* Connected sources (includes the internal test source). */}
      <section className="mb-8">
        <h2 className="text-h3 text-ink mb-3">{t('connected')}</h2>
        {accounts && accounts.length > 0 ? (
          <Card>
            <CardBody className="py-2">
              <ul className="divide-border divide-y">
                {accounts.map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <ConnectedSourceRow
                        name={a.display_name || DISPLAY_NAME[a.connector_key] || a.connector_key}
                        statusLabel={t('allSafe')}
                        updatedLabel={
                          a.last_successful_archive_at ? t('updatedToday') : tHealth('archiving')
                        }
                        itemsLabel=""
                      />
                    </div>
                    <ButtonLink href={`/bronnen/${a.id}`} variant="ghost" size="sm">
                      {t('manage')}
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : (
          <EmptyState
            title={t('subtitle')}
            description={t('notConnected')}
            action={<ButtonLink href="/onboarding">{tActions('connect')}</ButtonLink>}
          />
        )}
      </section>

      {/* Available sources grouped by category (§4), registry-driven actions. */}
      {CATEGORIES.map((cat) => {
        const sources = connectorsByCategory(cat.key).filter(
          (c) => !connectedKeys.has(c.connectorKey),
        );
        if (sources.length === 0) return null;
        return (
          <section key={cat.key} className="mb-6">
            <h2 className="text-h3 text-ink mb-3">{t(cat.label)}</h2>
            <Card>
              <CardBody className="py-2">
                <ul className="divide-border divide-y">{sources.map(renderSource)}</ul>
              </CardBody>
            </Card>
          </section>
        );
      })}
    </div>
  );
}
