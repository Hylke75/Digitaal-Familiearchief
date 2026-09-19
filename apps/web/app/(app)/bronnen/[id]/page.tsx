import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { RefreshCw } from 'lucide-react';
import { getConnector } from '@dla/connectors';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { HealthPill } from '@/components/ui/StatusBanner';
import { createClient } from '@/lib/supabase/server';
import {
  archiveNowAction,
  disconnectAction,
  setFrequencyAction,
} from '@/lib/archive/source-actions';

const FREQ = ['daily', 'weekly', 'monthly'] as const;

export default async function SourceDetailPage({ params }: { params: { id: string } }) {
  const t = await getTranslations('sources');
  const tHealth = await getTranslations('health');
  const f = await getFormatter();

  const supabase = createClient();
  const { data: account } = await supabase
    .from('connector_accounts')
    .select(
      'id, connector_key, display_name, status, archive_frequency, connected_at, last_successful_archive_at',
    )
    .eq('id', params.id)
    .maybeSingle();

  if (!account) notFound();

  const { count } = await supabase
    .from('archive_item_sources')
    .select('id', { count: 'exact', head: true })
    .eq('connector_account_id', account.id);

  const capability = getConnector(account.connector_key);
  const canArchiveNow = account.connector_key === 'mock' || capability?.automaticSync === true;
  const isImport = capability?.connectionType === 'archive_import';
  const name = account.display_name || capability?.displayName || account.connector_key;
  const fmtDate = (v: string | null) =>
    v ? f.dateTime(new Date(v), { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={name} subtitle={t('manageTitle')} />

      <Card className="mb-6">
        <CardBody className="space-y-4">
          <HealthPill status="safe" label={t('allSafe')} />
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Row label={t('filesLabel')} value={f.number(count ?? 0)} />
            <Row label={t('firstArchive')} value={fmtDate(account.connected_at)} />
            <Row label={t('lastUpdate')} value={fmtDate(account.last_successful_archive_at)} />
          </dl>
        </CardBody>
      </Card>

      {/* Frequency (§42) */}
      <Card className="mb-6">
        <CardBody>
          <h2 className="text-h3 text-ink mb-3">{t('checkFrequency')}</h2>
          <form action={setFrequencyAction} className="space-y-3">
            <input type="hidden" name="accountId" value={account.id} />
            <div className="flex flex-wrap gap-4">
              {FREQ.map((freq) => (
                <label key={freq} className="text-body text-ink flex items-center gap-2">
                  <input
                    type="radio"
                    name="frequency"
                    value={freq}
                    defaultChecked={account.archive_frequency === freq}
                  />
                  {t(freq)}
                </label>
              ))}
            </div>
            <Button type="submit" variant="secondary" size="sm">
              {t('save')}
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Archive now / import again */}
      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-body text-ink-soft">{isImport ? t('importAgain') : t('checkNow')}</p>
          {isImport ? (
            <ButtonLink href="/importeren" variant="secondary" size="sm">
              {t('importAgain')}
            </ButtonLink>
          ) : canArchiveNow ? (
            <form action={archiveNowAction}>
              <input type="hidden" name="accountId" value={account.id} />
              <Button type="submit" variant="secondary" size="sm">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {t('checkNow')}
              </Button>
            </form>
          ) : null}
        </CardBody>
      </Card>

      {/* Connection / disconnect (§43) */}
      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-h3 text-ink">{t('connection')}</h2>
          <details>
            <summary className="text-body text-ink cursor-pointer font-semibold">
              {t('disconnect')}
            </summary>
            <div className="mt-3 space-y-3">
              <p className="text-small text-ink-soft">{t('disconnectNote')}</p>
              <form action={disconnectAction}>
                <input type="hidden" name="accountId" value={account.id} />
                <Button type="submit" variant="danger" size="sm">
                  {t('disconnect')}
                </Button>
              </form>
            </div>
          </details>
          <p className="text-caption text-ink-soft pt-2">
            {tHealth('safe')} · {t('deleteArchiveNote')}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-small text-ink-soft">{label}</dt>
      <dd className="text-body text-ink font-semibold">{value}</dd>
    </div>
  );
}
