import { getLocale, getTranslations } from 'next-intl/server';
import { Download, Globe, Mail, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Instellingen' };

export default async function SettingsPage() {
  const t = await getTranslations('settings');
  const locale = await getLocale();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const languageName = locale.startsWith('nl') ? 'Nederlands' : 'English';

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
              {languageName}
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
    </div>
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
