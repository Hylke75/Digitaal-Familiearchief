import { getTranslations } from 'next-intl/server';
import { HeartHandshake, Trash2, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { TrustedLinkButton } from '@/components/legacy/TrustedLinkButton';
import { listTrustedPeople, type TrustedScopes } from '@/lib/archive/legacy';
import {
  addTrustedPersonAction,
  removeTrustedPersonAction,
  toggleTrustedScopeAction,
} from '@/lib/archive/legacy-actions';

export const metadata = { title: 'Als mij iets overkomt' };

const SCOPES: Array<{ key: keyof TrustedScopes; label: string }> = [
  { key: 'photos', label: 'scopePhotos' },
  { key: 'family', label: 'scopeFamily' },
  { key: 'social', label: 'scopeSocial' },
  { key: 'documents', label: 'scopeDocuments' },
];

/**
 * "Als mij iets overkomt" (DESIGN §35–36). Warm, geen grafsteen. Je wijst
 * vertrouwde personen aan en kiest waar ze later bij mogen — meer niet.
 * Automatische overdracht is bewust niet actief (§38–39).
 */
export default async function LegacyPage() {
  const t = await getTranslations('legacy');
  const people = await listTrustedPeople();

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('intro')} />

      <div className="border-border bg-warm/40 rounded-card mb-8 flex items-start gap-3 border p-4">
        <ShieldCheck className="text-forest mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-small text-ink-soft">{t('notActive')}</p>
      </div>

      <form
        action={addTrustedPersonAction}
        className="border-border rounded-card mb-8 flex flex-col gap-3 border p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="name" className="text-small text-ink mb-1 block font-medium">
            {t('nameLabel')}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder={t('namePlaceholder')}
            className="border-border rounded-button text-body focus:border-forest w-full border px-4 py-2.5 outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="email" className="text-small text-ink mb-1 block font-medium">
            {t('emailLabel')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder={t('emailPlaceholder')}
            className="border-border rounded-button text-body focus:border-forest w-full border px-4 py-2.5 outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-button bg-forest text-body px-5 py-2.5 font-medium text-white"
        >
          {t('add')}
        </button>
      </form>

      {people.length === 0 ? (
        <EmptyState
          icon={<HeartHandshake className="h-8 w-8" aria-hidden="true" />}
          title={t('empty')}
          description={t('emptyBody')}
        />
      ) : (
        <ul className="space-y-4">
          {people.map((p) => (
            <li key={p.id} className="border-border rounded-card border p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-h4 text-ink truncate">{p.name}</p>
                  {p.email ? <p className="text-small text-ink-soft truncate">{p.email}</p> : null}
                  <p className="text-small mt-1">
                    {p.confirmedAt ? (
                      <span className="text-forest inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        {p.confirmedName
                          ? t('confirmedAs', { name: p.confirmedName })
                          : t('confirmedYes')}
                      </span>
                    ) : (
                      <span className="text-ink-soft">{t('confirmedNo')}</span>
                    )}
                  </p>
                </div>
                <form action={removeTrustedPersonAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    aria-label={t('remove')}
                    className="text-ink-soft hover:text-danger shrink-0 p-1.5"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>
              </div>

              <p className="text-small text-ink-soft mb-2 mt-4">{t('scopesTitle')}</p>
              <div className="flex flex-wrap gap-2">
                {SCOPES.map((s) => {
                  const on = p.scopes[s.key];
                  return (
                    <form key={s.key} action={toggleTrustedScopeAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="scope" value={s.key} />
                      <input type="hidden" name="value" value={on ? '0' : '1'} />
                      <button
                        type="submit"
                        role="switch"
                        aria-checked={on}
                        className={`rounded-button text-small border px-3 py-1.5 font-medium ${
                          on
                            ? 'border-forest bg-forest/10 text-forest'
                            : 'border-border text-ink-soft hover:bg-warm'
                        }`}
                      >
                        {on ? '✓ ' : ''}
                        {t(s.label)}
                      </button>
                    </form>
                  );
                })}
              </div>

              <div className="mt-4">
                <TrustedLinkButton
                  personId={p.id}
                  hasLink={p.hasLink}
                  labels={{
                    create: t('linkCreate'),
                    recreate: t('linkRecreate'),
                    created: t('linkCreated'),
                    copyLink: t('copyLink'),
                    copied: t('copied'),
                  }}
                />
                <p className="text-small text-ink-soft mt-2">{t('linkHint')}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
