'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Loader2, UploadCloud } from 'lucide-react';

interface Labels {
  guestUpload: string;
  guestNameLabel: string;
  guestNamePlaceholder: string;
  guestSend: string;
  guestSending: string;
  guestThanks: string;
  guestThanksBody: string;
  guestAddMore: string;
  guestError: string;
  guestTooLarge: string;
  guestNotAllowed: string;
}

const MAX_BYTES = 50 * 1024 * 1024;

/**
 * Gast-uploadformulier. Geen account: we posten het bestand naar de
 * service-role-route bij het token. De gast krijgt alleen een bevestiging; de
 * eigenaar keurt de foto later goed. Grootte/type checken we ook client-side
 * voor een vriendelijke melding, maar de server beslist.
 */
export function GuestUpload({ token, labels }: { token: string; labels: Labels }) {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | null) => {
    setError(null);
    if (f && f.size > MAX_BYTES) {
      setError(labels.guestTooLarge);
      setFile(null);
      return;
    }
    if (f && !/^(image|video)\//.test(f.type)) {
      setError(labels.guestNotAllowed);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const send = async () => {
    if (!file) return;
    setState('sending');
    setError(null);
    try {
      const body = new FormData();
      body.set('file', file);
      if (name.trim()) body.set('contributor', name.trim());
      const res = await fetch(`/api/gebeurtenis/${token}`, { method: 'POST', body });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(
          data?.error === 'too_large'
            ? labels.guestTooLarge
            : data?.error === 'not_allowed'
              ? labels.guestNotAllowed
              : labels.guestError,
        );
        setState('idle');
        return;
      }
      setState('done');
    } catch {
      setError(labels.guestError);
      setState('idle');
    }
  };

  const reset = () => {
    setFile(null);
    setName('');
    setState('idle');
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (state === 'done') {
    return (
      <div className="border-forest/30 bg-forest/5 rounded-card border p-6 text-center">
        <CheckCircle2 className="text-forest mx-auto h-10 w-10" aria-hidden="true" />
        <p className="text-h4 text-ink mt-3">{labels.guestThanks}</p>
        <p className="text-body text-ink-soft mt-1">{labels.guestThanksBody}</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-button border-border text-small hover:bg-warm mt-4 inline-flex items-center gap-2 border px-5 py-2.5 font-medium"
        >
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          {labels.guestAddMore}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="guest-name" className="text-small text-ink mb-1 block font-medium">
          {labels.guestNameLabel}
        </label>
        <input
          id="guest-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={labels.guestNamePlaceholder}
          className="border-border rounded-button text-body focus:border-forest w-full border px-4 py-2.5 outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="guest-file"
          className="border-border rounded-card hover:bg-warm flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-8 text-center"
        >
          <UploadCloud className="text-ink-soft h-8 w-8" aria-hidden="true" />
          <span className="text-body text-ink font-medium">
            {file ? file.name : labels.guestUpload}
          </span>
          <input
            ref={inputRef}
            id="guest-file"
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {error ? (
        <p className="text-small text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={send}
        disabled={!file || state === 'sending'}
        className="rounded-button bg-forest text-body inline-flex w-full items-center justify-center gap-2 px-5 py-3 font-medium text-white disabled:opacity-60"
      >
        {state === 'sending' ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            {labels.guestSending}
          </>
        ) : (
          labels.guestSend
        )}
      </button>
    </div>
  );
}
