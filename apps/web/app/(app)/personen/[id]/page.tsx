import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft, Settings2, UserRound, X } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { MediaTile } from '@/components/archive/MediaTile';
import { getPerson } from '@/lib/archive/people';
import {
  deletePersonAction,
  removePersonFromItemAction,
  renamePersonAction,
} from '@/lib/archive/people-actions';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const person = await getPerson(params.id);
  return { title: person?.name ?? 'Persoon' };
}

export default async function PersonDetailPage({ params }: { params: { id: string } }) {
  const person = await getPerson(params.id);
  if (!person) notFound();

  const locale = await getLocale();
  const t = await getTranslations('people');
  const tNav = await getTranslations('nav');

  return (
    <div>
      <Link
        href="/personen"
        className="text-ink-soft hover:text-ink text-small mb-4 inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {tNav('people')}
      </Link>

      <PageHeader title={person.name} subtitle={t('count', { count: person.items.length })} />

      <details className="mb-6">
        <summary className="text-ink-soft hover:text-ink text-small inline-flex cursor-pointer list-none items-center gap-2 font-medium">
          <Settings2 className="h-4 w-4" aria-hidden="true" />
          {t('rename')}
        </summary>
        <div className="mt-3 space-y-3">
          <form action={renamePersonAction} className="flex max-w-md gap-2">
            <input type="hidden" name="personId" value={person.id} />
            <input
              name="name"
              defaultValue={person.name}
              required
              maxLength={120}
              aria-label={t('rename')}
              className="border-border rounded-button focus:border-forest text-body flex-1 border px-3 py-2 outline-none"
            />
            <button
              type="submit"
              className="rounded-button bg-forest text-small px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
            >
              {t('save')}
            </button>
          </form>
          <form action={deletePersonAction}>
            <input type="hidden" name="personId" value={person.id} />
            <button type="submit" className="text-danger text-small font-medium hover:underline">
              {t('deletePerson')}
            </button>
          </form>
        </div>
      </details>

      {person.items.length === 0 ? (
        <EmptyState
          icon={<UserRound className="h-8 w-8" aria-hidden="true" />}
          title={t('emptyPersonTitle')}
          description={t('emptyPersonBody')}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {person.items.map((item) => (
            <li key={item.id} className="group relative">
              <MediaTile item={item} locale={locale} />
              <form
                action={removePersonFromItemAction}
                className="absolute left-2 top-2 z-30 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
              >
                <input type="hidden" name="personId" value={person.id} />
                <input type="hidden" name="itemId" value={item.id} />
                <button
                  type="submit"
                  aria-label={t('removeFromPerson')}
                  title={t('removeFromPerson')}
                  className="text-ink inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur hover:bg-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
