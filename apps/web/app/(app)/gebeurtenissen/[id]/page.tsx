import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { ArrowLeft, Check, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { AutoRefreshImage } from '@/components/archive/AutoRefreshImage';
import { InviteManager } from '@/components/events/InviteManager';
import { OwnItemsPicker } from '@/components/events/OwnItemsPicker';
import { getEvent } from '@/lib/archive/events';
import { listMedia } from '@/lib/archive/queries';
import {
  approveEventItemAction,
  deleteEventAction,
  rejectEventItemAction,
  setGuestsSeePhotosAction,
} from '@/lib/archive/events-actions';

export const metadata = { title: 'Gebeurtenis' };

/**
 * Detail van één gebeurtenis. De eigenaar keurt gastbijdragen goed of af, voegt
 * eigen foto's toe, beheert uitnodigingen en zet meekijken aan/uit. Gastbijdragen
 * die nog wachten staan bovenaan — ze horen pas in het archief na goedkeuring.
 */
export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const t = await getTranslations('events');
  const f = await getFormatter();
  const event = await getEvent(params.id);
  if (!event) notFound();

  const day = (d: string | null) =>
    d ? f.dateTime(new Date(d), { day: 'numeric', month: 'long', year: 'numeric' }) : t('noDate');
  const shortDate = (iso: string) => f.dateTime(new Date(iso), { day: 'numeric', month: 'short' });

  // Kandidaten voor "eigen foto's toevoegen": recente eigen media, min wat er al in zit.
  const inEvent = new Set([
    ...event.approved.map((c) => c.id),
    ...event.pending.map((p) => p.item.id),
  ]);
  const recent = await listMedia({ visualOnly: true, pageSize: 60 });
  const candidates = recent.items.filter((c) => !inEvent.has(c.id));

  return (
    <div>
      <Link
        href="/gebeurtenissen"
        className="text-small text-ink-soft hover:text-ink mb-2 inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('backToList')}
      </Link>
      <PageHeader title={event.title} subtitle={day(event.happenedOn)} />

      <div className="space-y-8">
        {/* Wacht op goedkeuring */}
        {event.pending.length > 0 ? (
          <section className="border-forest/30 bg-forest/5 rounded-card border p-5">
            <h2 className="text-h4 text-ink">{t('pendingTitle')}</h2>
            <p className="text-small text-ink-soft mt-1">{t('pendingBody')}</p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {event.pending.map((p) => (
                <li
                  key={p.eventItemId}
                  className="border-border rounded-card overflow-hidden border bg-white"
                >
                  <span className="bg-warm relative block aspect-square overflow-hidden">
                    {p.item.thumbUrl ? (
                      <AutoRefreshImage
                        itemId={p.item.id}
                        src={p.item.thumbUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </span>
                  <div className="p-2">
                    <p className="text-small text-ink-soft truncate">
                      {p.contributedBy
                        ? t('contributedBy', { name: p.contributedBy })
                        : t('contributedByUnknown')}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <form action={approveEventItemAction} className="flex-1">
                        <input type="hidden" name="eventItemId" value={p.eventItemId} />
                        <input type="hidden" name="eventId" value={event.id} />
                        <button
                          type="submit"
                          className="rounded-button bg-forest text-small flex w-full items-center justify-center gap-1 py-1.5 font-medium text-white"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          {t('approve')}
                        </button>
                      </form>
                      <form action={rejectEventItemAction}>
                        <input type="hidden" name="eventItemId" value={p.eventItemId} />
                        <input type="hidden" name="eventId" value={event.id} />
                        <button
                          type="submit"
                          aria-label={t('reject')}
                          className="rounded-button border-border text-ink-soft hover:bg-warm flex items-center justify-center border p-1.5"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Goedgekeurde foto's */}
        {event.approved.length > 0 ? (
          <section>
            <h2 className="text-h4 text-ink mb-3">{t('approvedTitle')}</h2>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {event.approved.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/archief/${c.id}`}
                    className="bg-warm block aspect-square overflow-hidden rounded-lg"
                  >
                    {c.thumbUrl ? (
                      <AutoRefreshImage
                        itemId={c.id}
                        src={c.thumbUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <OwnItemsPicker
          eventId={event.id}
          candidates={candidates}
          labels={{
            addOwn: t('addOwn'),
            addOwnHint: t('addOwnHint'),
            addSelected: (count) => t('addSelected', { count }),
            addOwnEmpty: t('addOwnEmpty'),
          }}
        />

        <InviteManager
          eventId={event.id}
          invites={event.invites}
          formatDate={shortDate}
          labels={{
            invitesTitle: t('invitesTitle'),
            invitesHint: t('invitesHint'),
            inviteLabel: t('inviteLabel'),
            inviteLabelPlaceholder: t('inviteLabelPlaceholder'),
            createInvite: t('createInvite'),
            inviteCreated: t('inviteCreated'),
            copyLink: t('copyLink'),
            copied: t('copied'),
            inviteUsed: t('inviteUsed'),
            inviteRevoked: t('inviteRevoked'),
            inviteExpires: (date) => t('inviteExpires', { date }),
            revoke: t('revoke'),
            noInvites: t('noInvites'),
          }}
        />

        {/* Instellingen */}
        <section className="border-border rounded-card space-y-4 border p-5">
          <form
            action={setGuestsSeePhotosAction}
            className="flex items-start justify-between gap-4"
          >
            <div>
              <p className="text-body text-ink font-medium">{t('guestsSeePhotos')}</p>
              <p className="text-small text-ink-soft mt-0.5">{t('guestsSeePhotosHint')}</p>
            </div>
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="value" value={event.guestsSeePhotos ? '0' : '1'} />
            <button
              type="submit"
              role="switch"
              aria-checked={event.guestsSeePhotos}
              aria-label={t('guestsSeePhotos')}
              className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                event.guestsSeePhotos ? 'bg-forest' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  event.guestsSeePhotos ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </form>

          <div className="border-border flex items-center justify-between gap-4 border-t pt-4">
            <div>
              <p className="text-body text-ink font-medium">{t('deleteEvent')}</p>
              <p className="text-small text-ink-soft mt-0.5">{t('deleteEventHint')}</p>
            </div>
            <form action={deleteEventAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <button
                type="submit"
                className="rounded-button border-danger text-danger hover:bg-danger/5 text-small inline-flex shrink-0 items-center gap-2 border px-4 py-2 font-medium"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t('deleteEvent')}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
