import { getTranslations } from 'next-intl/server';
import { Sparkles } from 'lucide-react';
import { signOutAction } from '@/lib/auth/actions';

/** Shown at the top of the app when the current session is the shared demo
 * account, so visitors know it's a showcase and changes aren't persisted. */
export async function DemoBanner() {
  const t = await getTranslations('demo');
  return (
    <div className="bg-forest rounded-card text-small mb-6 flex items-center justify-between gap-3 px-4 py-2 text-white">
      <span className="inline-flex items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t('banner')}
      </span>
      <form action={signOutAction}>
        <button type="submit" className="shrink-0 font-medium underline underline-offset-2">
          {t('exit')}
        </button>
      </form>
    </div>
  );
}
