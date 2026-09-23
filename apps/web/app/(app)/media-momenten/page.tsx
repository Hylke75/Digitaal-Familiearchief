import { getFormatter, getTranslations } from 'next-intl/server';
import { Clapperboard, ExternalLink, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { AddMomentForm } from '@/components/media-moments/AddMomentForm';
import { listMediaMoments } from '@/lib/beeld-en-geluid/references-db';
import { deleteMediaMomentAction } from '@/lib/beeld-en-geluid/references-actions';

export const metadata = { title: 'Media-momenten' };

/**
 * Media moments — TV/radio moments from the user's personal history that live at
 * Beeld & Geluid (docs/connectors/beeld-en-geluid.md). Link-only by design:
 * Bewora stores the personal memory + an official link, never protected media,
 * and never accesses the Schatkamer automatically.
 */
export default async function MediaMomentsPage() {
  const t = await getTranslations('mediaMoments');
  const f = await getFormatter();
  const moments = await listMediaMoments();

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <p className="text-body text-ink-soft mb-6 max-w-2xl">{t('intro')}</p>

      <section className="border-border rounded-card bg-surface mb-8 border p-5">
        <h2 className="text-h3 text-ink mb-4">{t('addTitle')}</h2>
        <AddMomentForm />
      </section>

      {moments.length === 0 ? (
        <EmptyState
          icon={<Clapperboard className="h-8 w-8" aria-hidden="true" />}
          title={t('emptyTitle')}
          description={t('emptyBody')}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {moments.map((m) => (
            <li
              key={m.id}
              className="border-border rounded-card bg-surface flex flex-col gap-3 border p-4"
            >
              <div className="flex items-start gap-3">
                <span className="bg-warm text-forest inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]">
                  <Clapperboard className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-ink font-semibold leading-snug">{m.title}</h3>
                  <p className="text-caption text-ink-soft mt-0.5">
                    {[
                      m.broadcastNote,
                      m.fragmentLabel ? `${t('fragmentAt')} ${m.fragmentLabel}` : null,
                      f.dateTime(new Date(m.createdAt), { dateStyle: 'medium' }),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>

              {m.note ? <p className="text-body text-ink whitespace-pre-line">{m.note}</p> : null}

              <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                <a
                  href={m.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-forest inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  {t('watchAt')}
                </a>
                <form action={deleteMediaMomentAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    className="text-ink-soft hover:text-danger rounded-full p-2 transition-colors"
                    aria-label={`${t('remove')}: ${m.title}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
