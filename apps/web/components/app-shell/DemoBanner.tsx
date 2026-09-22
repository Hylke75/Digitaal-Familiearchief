import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Sparkles } from 'lucide-react';
import { signOutAction } from '@/lib/auth/actions';

/** Shown at the top of the app when the current session is the shared demo
 * account, so visitors know it's a showcase and changes aren't persisted — and
 * so the demo (the strongest sales moment) invites them to start their own. */
export async function DemoBanner() {
  const t = await getTranslations('demo');
  return (
    <div className="bg-forest rounded-card text-small mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-white">
      <span className="inline-flex items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t('banner')}
      </span>
      <span className="flex shrink-0 items-center gap-4">
        <Link
          href="/registreren"
          className="rounded-button text-forest bg-white/95 px-3 py-1 font-semibold hover:bg-white"
        >
          {t('startOwn')}
        </Link>
        <form action={signOutAction}>
          <button type="submit" className="font-medium underline underline-offset-2">
            {t('exit')}
          </button>
        </form>
      </span>
    </div>
  );
}
