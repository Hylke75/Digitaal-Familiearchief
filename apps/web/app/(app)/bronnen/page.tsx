import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { ScanLine } from 'lucide-react';
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
import { getAssistedGuide } from '@/lib/connectors/assisted';

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
  const tScan = await getTranslations('scan');

  const supabase = createClient();
  const { data: accounts } = await supabase
    .from('connector_accounts')
    .select('id, connector_key, display_name, last_successful_archive_at')
    .order('created_at', { ascending: true });

  const connectedKeys = new Set((accounts ?? []).map((a) => a.connector_key));

  // Apple Photos cannot be connected from a browser (needs a native iOS app,
  // docs/mobile/apple-photos.md). On an iPhone we surface the working path —
  // importing straight from the device — prominently instead of a dead end.
  const userAgent = headers().get('user-agent') ?? '';
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const showIphonePrompt = isIOS && !connectedKeys.has('phone');

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
    // Assisted transfer (Instagram/Facebook via Meta → Dropbox).
    const assisted = getAssistedGuide(c.connectorKey);
    const description = assisted?.description ?? c.description;
    return (
      <li key={c.connectorKey} className="flex items-center gap-3 py-3">
        <SourceLogo name={c.displayName} />
        <div className="min-w-0 flex-1">
          <p className="text-ink truncate font-semibold">{c.displayName}</p>
          {description ? <p className="text-small text-ink-soft truncate">{description}</p> : null}
        </div>
        {liveConnectable ? (
          <ButtonLink href={`/auth/${c.connectorKey}/start`} size="sm">
            {tActions('connect')}
          </ButtonLink>
        ) : assisted ? (
          <ButtonLink href={assisted.href} size="sm">
            {assisted.label}
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

      {/* iPhone visitors: promote the working device-import path (§3). */}
      {showIphonePrompt ? (
        <div className="mb-8">
          <Card>
            <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <SourceLogo name="Apple Foto's" />
                <div className="min-w-0">
                  <p className="text-ink font-semibold">{t('iphoneTitle')}</p>
                  <p className="text-small text-ink-soft">{t('iphoneBody')}</p>
                </div>
              </div>
              <ButtonLink href="/importeren?connector=phone" className="shrink-0">
                {t('iphoneCta')}
              </ButtonLink>
            </CardBody>
          </Card>
        </div>
      ) : null}

      <div className="mb-8">
        <Card>
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="bg-warm text-forest flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <ScanLine className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-ink font-semibold">{tScan('title')}</p>
                <p className="text-small text-ink-soft">{tScan('subtitle')}</p>
              </div>
            </div>
            <ButtonLink href="/scannen" className="shrink-0">
              {tScan('choose')}
            </ButtonLink>
          </CardBody>
        </Card>
      </div>

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
