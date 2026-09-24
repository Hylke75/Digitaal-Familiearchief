'use client';

import { useState, useTransition } from 'react';
import { Check, Copy, Link2, Loader2 } from 'lucide-react';
import { createInviteAction, revokeInviteAction } from '@/lib/archive/events-actions';
import type { InviteView } from '@/lib/archive/events';

interface Labels {
  invitesTitle: string;
  invitesHint: string;
  inviteLabel: string;
  inviteLabelPlaceholder: string;
  createInvite: string;
  inviteCreated: string;
  copyLink: string;
  copied: string;
  inviteUsed: string;
  inviteRevoked: string;
  inviteExpires: (date: string) => string;
  revoke: string;
  noInvites: string;
}

/**
 * Uitnodigingen beheren. Bij het maken toont de server het token één keer; we
 * bouwen er de deelbare link mee (origin uit de browser) en tonen die met een
 * kopieerknop. Daarna is alleen de status nog te zien — het token is weg.
 */
export function InviteManager({
  eventId,
  invites,
  labels,
  formatDate,
}: {
  eventId: string;
  invites: InviteView[];
  labels: Labels;
  formatDate: (iso: string) => string;
}) {
  const [label, setLabel] = useState('');
  const [freshLink, setFreshLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const create = () => {
    startTransition(async () => {
      const res = await createInviteAction(eventId, label);
      if (res?.token) {
        setFreshLink(`${window.location.origin}/gebeurtenis/${res.token}`);
        setLabel('');
        setCopied(false);
      }
    });
  };

  const copy = async () => {
    if (!freshLink) return;
    try {
      await navigator.clipboard.writeText(freshLink);
      setCopied(true);
    } catch {
      /* clipboard geblokkeerd — de link staat zichtbaar in het veld */
    }
  };

  const status = (i: InviteView) =>
    i.revokedAt
      ? labels.inviteRevoked
      : i.usedAt
        ? labels.inviteUsed
        : labels.inviteExpires(formatDate(i.expiresAt));

  return (
    <section className="border-border rounded-card border p-5">
      <h2 className="text-h4 text-ink flex items-center gap-2">
        <Link2 className="text-ink-soft h-5 w-5" aria-hidden="true" />
        {labels.invitesTitle}
      </h2>
      <p className="text-small text-ink-soft mt-1">{labels.invitesHint}</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="invite-label">
          {labels.inviteLabel}
        </label>
        <input
          id="invite-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={labels.inviteLabelPlaceholder}
          className="border-border rounded-button text-body focus:border-forest flex-1 border px-4 py-2 outline-none"
        />
        <button
          type="button"
          onClick={create}
          disabled={pending}
          className="rounded-button bg-forest text-small inline-flex items-center justify-center gap-2 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Link2 className="h-4 w-4" aria-hidden="true" />
          )}
          {labels.createInvite}
        </button>
      </div>

      {freshLink ? (
        <div className="border-forest/30 bg-forest/5 rounded-card mt-3 border p-3">
          <p className="text-small text-ink mb-2 font-medium">{labels.inviteCreated}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={freshLink}
              onFocus={(e) => e.currentTarget.select()}
              className="border-border rounded-button text-small flex-1 border bg-white px-3 py-2 font-mono"
            />
            <button
              type="button"
              onClick={copy}
              className="rounded-button border-border text-small hover:bg-warm inline-flex items-center justify-center gap-2 border px-4 py-2 font-medium"
            >
              {copied ? (
                <Check className="text-forest h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? labels.copied : labels.copyLink}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="divide-border mt-4 divide-y">
        {invites.length === 0 ? (
          <li className="text-small text-ink-soft py-2">{labels.noInvites}</li>
        ) : (
          invites.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-body text-ink truncate">{i.recipientLabel || '—'}</p>
                <p className="text-small text-ink-soft">{status(i)}</p>
              </div>
              {!i.revokedAt ? (
                <form action={revokeInviteAction}>
                  <input type="hidden" name="inviteId" value={i.id} />
                  <input type="hidden" name="eventId" value={eventId} />
                  <button
                    type="submit"
                    className="text-small text-ink-soft hover:text-ink shrink-0 underline"
                  >
                    {labels.revoke}
                  </button>
                </form>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
