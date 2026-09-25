'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Copy, Loader2, ScanText } from 'lucide-react';
import { readHandwritingAction } from '@/lib/archive/handwriting-actions';

/**
 * "Lees handschrift" op de itemdetailpagina. Verschijnt alleen bij foto's. De
 * gebruiker start de herkenning zelf (expliciete toestemming); daarna staat de
 * tekst er en is hij doorzoekbaar. Foutmeldingen zijn menselijk — nooit een
 * technische status.
 */
export function HandwritingPanel({
  itemId,
  initialText,
}: {
  itemId: string;
  initialText: string | null;
}) {
  const t = useTranslations('handwriting');
  const [text, setText] = useState<string | null>(initialText);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = () => {
    setErrorKey(null);
    startTransition(async () => {
      const res = await readHandwritingAction(itemId);
      if (res.text) {
        setText(res.text);
        setCopied(false);
      } else {
        setErrorKey(res.error ?? 'failed');
      }
    });
  };

  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      /* klembord geblokkeerd — tekst staat zichtbaar */
    }
  };

  const errorText =
    errorKey === 'not_configured'
      ? t('errNotConfigured')
      : errorKey === 'empty'
        ? t('errEmpty')
        : errorKey
          ? t('errGeneric')
          : null;

  return (
    <section className="border-border rounded-card border p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h4 text-ink flex items-center gap-2">
          <ScanText className="text-ink-soft h-5 w-5" aria-hidden="true" />
          {t('title')}
        </h2>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="rounded-button border-border text-small hover:bg-warm inline-flex shrink-0 items-center gap-2 border px-4 py-2 font-medium disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ScanText className="h-4 w-4" aria-hidden="true" />
          )}
          {pending ? t('reading') : text ? t('reread') : t('read')}
        </button>
      </div>
      <p className="text-small text-ink-soft mt-1">{t('hint')}</p>

      {errorText ? (
        <p className="text-small text-danger mt-3" role="alert">
          {errorText}
        </p>
      ) : null}

      {text ? (
        <div className="mt-4">
          <div className="border-border rounded-card bg-warm/40 border p-4">
            <p className="text-body text-ink whitespace-pre-wrap">{text}</p>
          </div>
          <button
            type="button"
            onClick={copy}
            className="text-small text-ink-soft hover:text-ink mt-2 inline-flex items-center gap-1.5"
          >
            {copied ? (
              <Check className="text-forest h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
      ) : null}
    </section>
  );
}
