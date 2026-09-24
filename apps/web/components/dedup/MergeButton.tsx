'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Combine } from 'lucide-react';
import { mergeDuplicatesAction } from '@/lib/archive/dedup-actions';

/**
 * Merge a group of duplicates into the kept item. Reversible, so this is a calm
 * primary action, not a destructive one.
 */
export function MergeButton({
  keeperId,
  duplicateIds,
  label,
}: {
  keeperId: string;
  duplicateIds: string[];
  label?: string;
}) {
  const t = useTranslations('dedup');
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await mergeDuplicatesAction(keeperId, duplicateIds);
          router.refresh();
        })
      }
      className="bg-forest hover:bg-forest/90 text-small inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-semibold text-white disabled:opacity-60"
    >
      <Combine className="h-4 w-4" aria-hidden="true" />
      {label ?? t('merge')}
    </button>
  );
}
