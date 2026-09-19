import { getFormatter, getTranslations } from 'next-intl/server';
import { Plus, Sparkles } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { HealthPill } from '@/components/ui/StatusBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { ConnectedSourceRow } from '@/components/ui/SourceCard';
import { createClient } from '@/lib/supabase/server';

const DISPLAY_NAME: Record<string, string> = {
  mock: 'Testbron',
};

export default async function TodayPage() {
  const t = await getTranslations('dashboard');
  const tHealth = await getTranslations('health');
  const tSources = await getTranslations('sources');
  const f = await getFormatter();
  const n = (value: number) => f.number(value);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: summaryRaw }, { data: accounts }, { data: profile }] = await Promise.all([
    supabase.rpc('archive_summary'),
    supabase
      .from('connector_accounts')
      .select('id, connector_key, display_name, status, last_successful_archive_at')
      .order('created_at', { ascending: true }),
    user
      ? supabase.from('profiles').select('first_name').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const summary = (summaryRaw ?? {}) as Record<string, number>;
  const photos = summary.photo ?? 0;
  const videos = summary.video ?? 0;
  const documents = summary.document ?? 0;
  const other =
    (summary.post ?? 0) + (summary.message ?? 0) + (summary.audio ?? 0) + (summary.other ?? 0);
  const memories = photos + videos + documents + other;

  const name = profile?.first_name?.trim() || user?.email?.split('@')[0] || 'Jij';

  return (
    <div className="space-y-8">
      <div>
        <p className="text-body-lg text-ink-soft">{t('greetingMorning', { name })}</p>
        <div className="mt-2">
          <HealthPill status="safe" label={tHealth('safe')} />
        </div>
      </div>

      {memories === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-8 w-8" aria-hidden="true" />}
          title={t('memoriesSafe')}
          description={tSources('subtitle')}
          action={<ButtonLink href="/onboarding">{tSources('connect')}</ButtonLink>}
        />
      ) : (
        <Card>
          <CardBody className="text-center">
            <p className="text-forest text-[3.25rem] font-semibold leading-none sm:text-[4rem]">
              {n(memories)}
            </p>
            <p className="text-body text-ink-soft mt-2">{t('memoriesSafe')}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-left sm:grid-cols-4">
              <Stat value={n(photos)} label={t('breakdownPhotos')} />
              <Stat value={n(videos)} label={t('breakdownVideos')} />
              <Stat value={n(documents)} label={t('breakdownDocuments')} />
              <Stat value={n(other)} label={t('breakdownOther')} />
            </dl>
          </CardBody>
        </Card>
      )}

      <section>
        <h2 className="text-h3 text-ink mb-3">{t('sourcesTitle')}</h2>
        {accounts && accounts.length > 0 ? (
          <Card>
            <CardBody className="py-2">
              <ul className="divide-border divide-y">
                {accounts.map((a) => (
                  <li key={a.id}>
                    <ConnectedSourceRow
                      name={a.display_name || DISPLAY_NAME[a.connector_key] || a.connector_key}
                      statusLabel={tSources('allSafe')}
                      updatedLabel={
                        a.last_successful_archive_at
                          ? tSources('updatedToday')
                          : tHealth('archiving')
                      }
                      itemsLabel=""
                    />
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : null}
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
