'use client';

import { useState, useTransition } from 'react';
import { Check, Copy, Link2, Loader2 } from 'lucide-react';
import { createTrustedLinkAction } from '@/lib/archive/legacy-actions';

interface Labels {
  create: string;
  recreate: string;
  created: string;
  copyLink: string;
  copied: string;
}

/**
 * Maakt een bevestigingslink voor een vertrouwd persoon. De server toont het
 * token één keer; we bouwen er de deelbare link mee en tonen die met een
 * kopieerknop. Daarna is alleen de status nog zichtbaar.
 */
export function TrustedLinkButton({
  personId,
  hasLink,
  labels,
}: {
  personId: string;
  hasLink: boolean;
  labels: Labels;
}) {
  const [freshLink, setFreshLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const create = () => {
    startTransition(async () => {
      const res = await createTrustedLinkAction(personId);
      if (res?.token) {
        setFreshLink(`${window.location.origin}/nalatenschap/bevestigen/${res.token}`);
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
      /* klembord geblokkeerd — de link staat zichtbaar */
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={create}
        disabled={pending}
        className="rounded-button border-border text-small hover:bg-warm inline-flex items-center gap-2 border px-3 py-1.5 font-medium disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Link2 className="h-4 w-4" aria-hidden="true" />
        )}
        {hasLink ? labels.recreate : labels.create}
      </button>

      {freshLink ? (
        <div className="border-forest/30 bg-forest/5 rounded-card mt-2 border p-3">
          <p className="text-small text-ink mb-2 font-medium">{labels.created}</p>
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
    </div>
  );
}
