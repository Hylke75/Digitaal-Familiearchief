import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HeartHandshake } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { TrustedConfirmForm } from '@/components/legacy/TrustedConfirmForm';
import { resolveTrustedInvite } from '@/lib/legacy/confirm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Bevestigen', robots: { index: false } };

/**
 * Publieke bevestigingspagina voor een vertrouwd persoon. Geen account, geen
 * inzage in het archief: de persoon bevestigt alleen naam en contact. Ongeldige
 * of al bevestigde links tonen een rustige melding.
 */
export default async function ConfirmTrustedPage({ params }: { params: { token: string } }) {
  const t = await getTranslations('legacy');
  const tApp = await getTranslations('app');
  const invite = await resolveTrustedInvite(params.token);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <span className="text-h3 text-forest font-semibold">{tApp('name')}</span>
      </div>

      {!invite ? (
        <Card>
          <CardBody className="space-y-2 text-center sm:p-8">
            <h1 className="text-h3 text-ink">{t('invalid')}</h1>
            <p className="text-body text-ink-soft">{t('invalidBody')}</p>
          </CardBody>
        </Card>
      ) : invite.alreadyConfirmed ? (
        <Card>
          <CardBody className="space-y-2 text-center sm:p-8">
            <HeartHandshake className="text-forest mx-auto h-8 w-8" aria-hidden="true" />
            <h1 className="text-h3 text-ink">{t('alreadyConfirmed')}</h1>
            <p className="text-body text-ink-soft">{t('alreadyBody')}</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="space-y-5 sm:p-8">
            <div className="text-center">
              <HeartHandshake className="text-forest mx-auto h-8 w-8" aria-hidden="true" />
              <h1 className="text-h3 text-ink mt-3">{t('confirmTitle')}</h1>
              <p className="text-body text-ink-soft mt-1">{t('confirmIntro')}</p>
            </div>
            <TrustedConfirmForm
              token={params.token}
              labels={{
                nameLabel: t('confirmNameLabel'),
                namePlaceholder: t('confirmNamePlaceholder'),
                contactLabel: t('confirmContactLabel'),
                contactPlaceholder: t('confirmContactPlaceholder'),
                submit: t('confirmSubmit'),
                submitting: t('confirmSubmitting'),
                thanks: t('confirmThanks'),
                thanksBody: t('confirmThanksBody'),
                error: t('confirmError'),
              }}
            />
          </CardBody>
        </Card>
      )}
    </main>
  );
}
