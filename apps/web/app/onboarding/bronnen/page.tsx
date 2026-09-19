import { getTranslations } from 'next-intl/server';
import { CONNECTOR_REGISTRY, onboardingAction } from '@dla/connectors';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SourceLogo } from '@/components/ui/SourceCard';
import { connectMockAction } from '@/lib/archive/actions';

export default async function OnboardingSourcesPage() {
  const t = await getTranslations('onboarding');
  const tActions = await getTranslations('actions');

  const others = CONNECTOR_REGISTRY.filter((c) => c.connectorKey !== 'mock');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-h2 text-ink">{t('sourcesTitle')}</h1>
        <p className="text-body text-ink-soft">{t('sourcesBody')}</p>
      </div>

      {/* Test source — the only connectable source in this phase. */}
      <Card>
        <CardBody className="flex items-center gap-3">
          <SourceLogo name="Testbron" />
          <div className="min-w-0 flex-1">
            <p className="text-ink font-semibold">Testbron</p>
            <p className="text-small text-ink-soft">
              100 foto&apos;s · 20 video&apos;s · 30 documenten
            </p>
          </div>
          <form action={connectMockAction}>
            <Button type="submit" size="sm">
              {t('connectTestSource')}
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Real providers — shown honestly as coming soon (no fake OAuth). */}
      <Card>
        <CardBody className="py-2">
          <ul className="divide-border divide-y">
            {others.map((c) => (
              <li key={c.connectorKey} className="flex items-center gap-3 py-3">
                <SourceLogo name={c.displayName} />
                <span className="text-ink min-w-0 flex-1 truncate font-semibold">
                  {c.displayName}
                </span>
                <Button variant="ghost" size="sm" disabled>
                  {onboardingAction(c) === 'import' ? tActions('import') : tActions('comingSoon')}
                </Button>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
