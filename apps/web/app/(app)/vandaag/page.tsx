import { getFormatter, getTranslations } from 'next-intl/server';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { HealthPill } from '@/components/ui/StatusBanner';
import { MediaGallery } from '@/components/archive/MediaGallery';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { listOnThisDay, listRecent } from '@/lib/archive/queries';
import { preservedSummary } from '@/lib/archive/preserved';

/**
 * Vandaag is a reason to come back, not a status report (design advice, §C):
 * memories of this day in earlier years, what came in recently, and one quiet
 * status line. The big number and per-type tallies live on Bronnen now.
 */
export default async function TodayPage() {
  const t = await getTranslations('dashboard');
  const tHealth = await getTranslations('health');
  const tSources = await getTranslations('sources');
  const tPreserved = await getTranslations('preserved');
  const f = await getFormatter();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: accounts }, onThisDay, recent, preserved] = await Promise.all([
    user
      ? supabase.from('profiles').select('first_name').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('connector_accounts')
      .select('last_successful_archive_at')
      .order('last_successful_archive_at', { ascending: false })
      .limit(1),
    listOnThisDay(),
    listRecent(),
    preservedSummary(),
  ]);

  const name = profile?.first_name?.trim() || user?.email?.split('@')[0] || 'Jij';
  const lastUpdate = accounts?.[0]?.last_successful_archive_at ?? null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-body-lg text-ink-soft">{t('greetingMorning', { name })}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <HealthPill status="safe" label={tHealth('safe')} />
          {lastUpdate ? (
            <span className="text-ink-soft text-small inline-flex items-center gap-1.5">
              <CheckCircle2 className="text-success h-4 w-4" aria-hidden="true" />
              {t('allUpdated')} · {f.dateTime(new Date(lastUpdate), { timeStyle: 'short' })}
            </span>
          ) : null}
        </div>
      </div>

      {preserved.count > 0 ? (
        <section className="border-border rounded-card bg-warm/50 border p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-h3 text-ink">{tPreserved('pageTitle')}</h2>
            <Link
              href="/bewaard-gebleven"
              className="text-forest inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            >
              {tPreserved('viewAll')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="text-body text-ink-soft mb-4">
            {tPreserved('blockTitle', { count: preserved.count })}
          </p>
          {preserved.recent.length > 0 ? (
            <MediaGallery items={preserved.recent} targetHeight={150} />
          ) : null}
        </section>
      ) : null}

      {onThisDay.length === 0 && recent.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-8 w-8" aria-hidden="true" />}
          title={t('memoriesSafe')}
          description={tSources('subtitle')}
          action={<ButtonLink href="/onboarding">{tSources('connect')}</ButtonLink>}
        />
      ) : (
        <>
          {onThisDay.length > 0 ? (
            <section>
              <h2 className="text-h3 text-ink mb-3">{t('recentTitle')}</h2>
              <MediaGallery items={onThisDay} targetHeight={260} />
            </section>
          ) : null}

          {recent.length > 0 ? (
            <section>
              <h2 className="text-h3 text-ink mb-3">{t('recentlyAdded')}</h2>
              <MediaGallery items={recent} />
            </section>
          ) : null}

          <ButtonLink href="/mijn-leven" variant="secondary">
            {t('viewArchive')}
          </ButtonLink>
        </>
      )}
    </div>
  );
}
