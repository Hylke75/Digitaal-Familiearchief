'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { confirmTrustedAction } from '@/lib/archive/legacy-actions';

interface Labels {
  nameLabel: string;
  namePlaceholder: string;
  contactLabel: string;
  contactPlaceholder: string;
  submit: string;
  submitting: string;
  thanks: string;
  thanksBody: string;
  error: string;
}

/**
 * Bevestigingsformulier voor een vertrouwd persoon (geen account, geen inzage).
 * De persoon bevestigt alleen naam en contact; dit verleent nooit toegang tot
 * het archief en zet geen overdracht in gang.
 */
export function TrustedConfirmForm({ token, labels }: { token: string; labels: Labels }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!name.trim()) return;
    setError(false);
    startTransition(async () => {
      const body = new FormData();
      body.set('name', name.trim());
      body.set('contact', contact.trim());
      const res = await confirmTrustedAction(token, body);
      if (res.ok) setDone(true);
      else setError(true);
    });
  };

  if (done) {
    return (
      <div className="border-forest/30 bg-forest/5 rounded-card border p-6 text-center">
        <CheckCircle2 className="text-forest mx-auto h-10 w-10" aria-hidden="true" />
        <p className="text-h4 text-ink mt-3">{labels.thanks}</p>
        <p className="text-body text-ink-soft mt-1">{labels.thanksBody}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="tc-name" className="text-small text-ink mb-1 block font-medium">
          {labels.nameLabel}
        </label>
        <input
          id="tc-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={labels.namePlaceholder}
          className="border-border rounded-button text-body focus:border-forest w-full border px-4 py-2.5 outline-none"
        />
      </div>
      <div>
        <label htmlFor="tc-contact" className="text-small text-ink mb-1 block font-medium">
          {labels.contactLabel}
        </label>
        <input
          id="tc-contact"
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={labels.contactPlaceholder}
          className="border-border rounded-button text-body focus:border-forest w-full border px-4 py-2.5 outline-none"
        />
      </div>

      {error ? (
        <p className="text-small text-danger" role="alert">
          {labels.error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={pending || !name.trim()}
        className="rounded-button bg-forest text-body inline-flex w-full items-center justify-center gap-2 px-5 py-3 font-medium text-white disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            {labels.submitting}
          </>
        ) : (
          labels.submit
        )}
      </button>
    </div>
  );
}
