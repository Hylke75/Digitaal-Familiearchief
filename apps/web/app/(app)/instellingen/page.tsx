import { getLocale, getTranslations } from 'next-intl/server';
import { Download, Globe, LogOut, Mail, ShieldAlert, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { setLocaleAction } from '@/lib/settings/locale-actions';
import { signOutAction } from '@/lib/auth/actions';

export const metadata = { title: 'Instellingen' };

export default async function SettingsPage() {
  const t = await getTranslations('settings');
  const tDedup = await getTranslations('dedup');
  const locale = await getLocale();
  const user = await getCurrentUser();
  const isNl = locale.startsWith('nl');

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={t('title')} />

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-ink font-semibold">{t('accountTitle')}</h2>
          <dl className="divide-border divide-y">
            <Row icon={<Mail className="h-4 w-4" aria-hidden="true" />} label={t('email')}>
              {user?.email ?? '—'}
            </Row>
            <Row icon={<Globe className="h-4 w-4" aria-hidden="true" />} label={t('language')}>
              <form
                action={setLocaleAction}
                className="flex gap-1"
                aria-label={t('languageChange')}
              >
                <LocaleButton locale="nl" active={isNl}>
                  Nederlands
                </LocaleButton>
                <LocaleButton locale="en" active={!isNl}>
                  English
                </LocaleButton>
              </form>
            </Row>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-ink font-semibold">{t('exportTitle')}</h2>
          <p className="text-body text-ink-soft">{t('exportBody')}</p>
          <ButtonLink href="/api/export">
            <Download className="h-4 w-4" aria-hidden="true" />
            {t('exportButton')}
          </ButtonLink>
          <p className="text-small text-ink-soft">{t('exportNote')}</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-ink font-semibold">{tDedup('title')}</h2>
          <p className="text-body text-ink-soft">{tDedup('subtitle')}</p>
          <ButtonLink href="/opruimen" variant="secondary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {tDedup('title')}
          </ButtonLink>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-ink inline-flex items-center gap-2 font-semibold">
            <ShieldAlert className="text-brass h-4 w-4" aria-hidden="true" />
            {t('deleteTitle')}
          </h2>
          <p className="text-body text-ink-soft">{t('deleteBody')}</p>
          <ButtonLink
            href="mailto:privacy@bewora.nl?subject=Verzoek%20tot%20accountverwijdering"
            variant="secondary"
          >
            {t('deleteButton')}
          </ButtonLink>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-ink font-semibold">{t('signOutTitle')}</h2>
          <p className="text-body text-ink-soft">{t('signOutBody')}</p>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t('signOut')}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

/** One language choice — a submit button that posts its locale. The active
 * language is shown as pressed (aria-pressed) rather than only by colour. */
function LocaleButton({
  locale,
  active,
  children,
}: {
  locale: 'nl' | 'en';
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      name="locale"
      value={locale}
      aria-pressed={active}
      className={`rounded-pill text-small focus-visible:ring-forest border px-3 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ${
        active
          ? 'bg-forest border-forest text-white'
          : 'border-border text-ink-soft hover:text-ink hover:border-forest/40'
      }`}
    >
      {children}
    </button>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-ink-soft text-small inline-flex items-center gap-2">
        {icon}
        {label}
      </dt>
      <dd className="text-ink min-w-0 truncate text-right">{children}</dd>
    </div>
  );
}
