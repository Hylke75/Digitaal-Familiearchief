import type { Metadata } from 'next';
import { getFormatter, getTranslations } from 'next-intl/server';
import { CalendarHeart } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { GuestUpload } from '@/components/events/GuestUpload';
import { resolveInvite } from '@/lib/events/guest';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Foto’s toevoegen', robots: { index: false } };

/**
 * Publieke uitnodigingspagina. Geen account, geen inlog: het token in de URL
 * bepaalt bij welke gebeurtenis de foto hoort. De gast ziet alleen de naam, de
 * datum en een uploadveld — nooit het archief zelf. Ongeldige of ingetrokken
 * links tonen een vriendelijke melding.
 */
export default async function GuestEventPage({ params }: { params: { token: string } }) {
  const t = await getTranslations('events');
  const tApp = await getTranslations('app');
  const f = await getFormatter();
  const invite = await resolveInvite(params.token);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <span className="text-h3 text-forest font-semibold">{tApp('name')}</span>
      </div>

      {!invite ? (
        <Card>
          <CardBody className="space-y-2 text-center sm:p-8">
            <h1 className="text-h3 text-ink">{t('guestInvalid')}</h1>
            <p className="text-body text-ink-soft">{t('guestInvalidBody')}</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="space-y-5 sm:p-8">
            <div className="text-center">
              <CalendarHeart className="text-forest mx-auto h-8 w-8" aria-hidden="true" />
              <p className="text-small text-ink-soft mt-3">{t('guestIntro')}</p>
              <h1 className="text-h3 text-ink mt-1">{invite.title}</h1>
              {invite.happenedOn ? (
                <p className="text-body text-ink-soft mt-0.5">
                  {f.dateTime(new Date(invite.happenedOn), {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              ) : null}
              {invite.description ? (
                <p className="text-body text-ink mt-3">{invite.description}</p>
              ) : null}
            </div>

            <GuestUpload
              token={params.token}
              labels={{
                guestUpload: t('guestUpload'),
                guestNameLabel: t('guestNameLabel'),
                guestNamePlaceholder: t('guestNamePlaceholder'),
                guestSend: t('guestSend'),
                guestSending: t('guestSending'),
                guestThanks: t('guestThanks'),
                guestThanksBody: t('guestThanksBody'),
                guestAddMore: t('guestAddMore'),
                guestError: t('guestError'),
                guestTooLarge: t('guestTooLarge'),
                guestNotAllowed: t('guestNotAllowed'),
              }}
            />
          </CardBody>
        </Card>
      )}
    </main>
  );
}
