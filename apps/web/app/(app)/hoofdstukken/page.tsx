import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { BookOpen, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { AutoRefreshImage } from '@/components/archive/AutoRefreshImage';
import { listChapters, suggestChapters } from '@/lib/archive/chapters';
import { createChapterAction, deleteChapterAction } from '@/lib/archive/chapters-actions';

export const metadata = { title: 'Hoofdstukken' };

/**
 * Het overzicht van alle hoofdstukken als verticale lijn met jaartallen — de
 * pagina die mensen aan anderen laten zien. Onderaan een paar voorstellen op
 * basis van gaten en verhuizingen (nooit automatisch aangemaakt).
 */
export default async function ChaptersPage() {
  const t = await getTranslations('chapters');
  const f = await getFormatter();
  const [chapters, suggestions] = await Promise.all([listChapters(), suggestChapters()]);

  const year = (d: string) => f.dateTime(new Date(d), { year: 'numeric' });
  const period = (start: string, end: string | null) =>
    end && year(end) !== year(start)
      ? `${year(start)} – ${year(end)}`
      : end
        ? year(start)
        : `${year(start)} – ${t('ongoing')}`;

  if (chapters.length === 0 && suggestions.length === 0) {
    return (
      <div>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <EmptyState
          icon={<BookOpen className="h-8 w-8" aria-hidden="true" />}
          title={t('empty')}
          description={t('emptyBody')}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {chapters.length > 0 ? (
        <ol className="border-border relative space-y-6 border-l pl-5">
          {chapters.map((c) => (
            <li key={c.id} className="relative">
              <span
                className="bg-forest absolute -left-[27px] top-2 h-3 w-3 rounded-full ring-4 ring-[color:var(--ivory,#F8F6F1)]"
                aria-hidden="true"
              />
              <div className="border-border rounded-card overflow-hidden border">
                <Link href={`/mijn-leven#hoofdstuk-${c.id}`} className="group block">
                  {c.cover?.thumbUrl ? (
                    <span className="bg-warm relative block aspect-[3/1] overflow-hidden">
                      <AutoRefreshImage
                        itemId={c.cover.id}
                        src={c.cover.thumbUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </span>
                  ) : null}
                  <span className="block p-4">
                    <span className="text-ink text-h3 block font-semibold">{c.title}</span>
                    <span className="text-ink-soft text-small block">
                      {period(c.startsOn, c.endsOn)}
                    </span>
                    {c.description ? (
                      <span className="text-body text-ink-soft mt-1 block">{c.description}</span>
                    ) : null}
                  </span>
                </Link>
                <div className="border-border flex justify-end border-t px-4 py-2">
                  <form action={deleteChapterAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="text-ink-soft hover:text-danger text-caption inline-flex items-center gap-1.5 font-medium"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('delete')}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {suggestions.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-h3 text-ink mb-3">{t('suggestionsTitle')}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {suggestions.map((s, i) => (
              <li key={i} className="border-border rounded-card border border-dashed p-4">
                <p className="text-ink font-medium">
                  {s.reason === 'move' ? t('suggestionMove') : t('suggestionGap')}
                </p>
                <p className="text-ink-soft text-small mb-3">{period(s.startsOn, s.endsOn)}</p>
                <form action={createChapterAction} className="flex flex-wrap gap-2">
                  <input type="hidden" name="startsOn" value={s.startsOn} />
                  {s.endsOn ? <input type="hidden" name="endsOn" value={s.endsOn} /> : null}
                  <input
                    name="title"
                    required
                    placeholder={t('titlePlaceholder')}
                    className="rounded-input border-border text-body focus-visible:border-forest min-w-0 flex-1 border px-3 py-2 outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-forest rounded-button text-small px-3 py-2 font-semibold text-white"
                  >
                    {t('useSuggestion')}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
