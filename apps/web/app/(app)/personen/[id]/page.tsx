import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft, Settings2, UserRound, Users, X } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { MediaTile } from '@/components/archive/MediaTile';
import { AutoRefreshImage } from '@/components/archive/AutoRefreshImage';
import {
  getPerson,
  listPeople,
  listPersonBranchItems,
  type RelatedPerson,
} from '@/lib/archive/people';
import {
  addPersonRelationAction,
  deletePersonAction,
  removePersonFromItemAction,
  removePersonRelationAction,
  renamePersonAction,
  updatePersonDetailsAction,
} from '@/lib/archive/people-actions';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const person = await getPerson(params.id);
  return { title: person?.name ?? 'Persoon' };
}

export default async function PersonDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { familie?: string };
}) {
  const person = await getPerson(params.id);
  if (!person) notFound();

  const locale = await getLocale();
  const t = await getTranslations('people');
  const tNav = await getTranslations('nav');
  const f = await getFormatter();

  const branch = searchParams?.familie === '1' && person.hasChildren;
  const items = branch ? await listPersonBranchItems(person.id) : person.items;
  const others = (await listPeople()).filter((p) => p.id !== person.id);
  const longDate = (d: string) => f.dateTime(new Date(d), { dateStyle: 'long' });

  const relGroups: Array<{ label: string; people: RelatedPerson[] }> = [
    { label: t('relParents'), people: person.relations.parents },
    { label: t('relPartner'), people: person.relations.partners },
    { label: t('relChildren'), people: person.relations.children },
    { label: t('relSiblings'), people: person.relations.siblings },
  ].filter((g) => g.people.length > 0);

  return (
    <div>
      <Link
        href="/personen"
        className="text-ink-soft hover:text-ink text-small mb-4 inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {tNav('people')}
      </Link>

      <PageHeader title={person.name} subtitle={t('count', { count: items.length })} />

      {person.birthDate || person.deathDate ? (
        <p className="text-ink-soft text-small -mt-2 mb-2">
          {[
            person.birthDate ? t('born', { date: longDate(person.birthDate) }) : null,
            person.deathDate ? t('died', { date: longDate(person.deathDate) }) : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      ) : null}
      {person.note ? <p className="text-body text-ink mb-4 max-w-2xl">{person.note}</p> : null}

      {/* Gegevens: naam, geboorte/overlijden, notitie, verwijderen. */}
      <details className="mb-6">
        <summary className="text-ink-soft hover:text-ink text-small inline-flex cursor-pointer list-none items-center gap-2 font-medium">
          <Settings2 className="h-4 w-4" aria-hidden="true" />
          {t('detailsTitle')}
        </summary>
        <div className="mt-3 max-w-md space-y-4">
          <form action={renamePersonAction} className="flex gap-2">
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
              className="rounded-button bg-forest text-small px-4 py-2 font-medium text-white hover:opacity-90"
            >
              {t('save')}
            </button>
          </form>

          <form action={updatePersonDetailsAction} className="space-y-3">
            <input type="hidden" name="personId" value={person.id} />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-caption text-ink-soft block">
                {t('birthLabel')}
                <input
                  type="date"
                  name="birthDate"
                  defaultValue={person.birthDate ?? ''}
                  className="border-border rounded-button text-body focus:border-forest mt-1 w-full border px-3 py-2 outline-none"
                />
              </label>
              <label className="text-caption text-ink-soft block">
                {t('deathLabel')}
                <input
                  type="date"
                  name="deathDate"
                  defaultValue={person.deathDate ?? ''}
                  className="border-border rounded-button text-body focus:border-forest mt-1 w-full border px-3 py-2 outline-none"
                />
              </label>
            </div>
            <label className="text-caption text-ink-soft block">
              {t('noteLabel')}
              <textarea
                name="note"
                rows={2}
                defaultValue={person.note ?? ''}
                className="border-border rounded-button text-body focus:border-forest mt-1 w-full border px-3 py-2 outline-none"
              />
            </label>
            <button
              type="submit"
              className="rounded-button bg-forest text-small px-4 py-2 font-medium text-white hover:opacity-90"
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

      {/* Familie: relatie-overzicht + relatie toevoegen. */}
      <section className="mb-6">
        <h2 className="text-h3 text-ink mb-3 inline-flex items-center gap-2">
          <Users className="text-forest h-5 w-5" aria-hidden="true" />
          {t('relationsTitle')}
        </h2>
        {relGroups.length > 0 ? (
          <div className="space-y-4">
            {relGroups.map((g) => (
              <div key={g.label}>
                <p className="text-caption text-ink-soft mb-1.5 font-medium">{g.label}</p>
                <ul className="flex flex-wrap gap-3">
                  {g.people.map((rp) => (
                    <li key={rp.id} className="group/rel relative">
                      <Link href={`/personen/${rp.id}`} className="inline-flex items-center gap-2">
                        <span className="bg-warm inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
                          {rp.coverThumbUrl ? (
                            <AutoRefreshImage
                              itemId={rp.id}
                              src={rp.coverThumbUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserRound className="text-ink-soft h-5 w-5" aria-hidden="true" />
                          )}
                        </span>
                        <span className="text-body text-ink">{rp.name}</span>
                      </Link>
                      <form action={removePersonRelationAction} className="inline">
                        <input type="hidden" name="personId" value={person.id} />
                        <input type="hidden" name="relatedPersonId" value={rp.id} />
                        <button
                          type="submit"
                          aria-label={t('removeRelation')}
                          className="text-ink-soft hover:text-danger ml-1 align-middle"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}

        {others.length > 0 ? (
          <form
            action={addPersonRelationAction}
            className="border-border rounded-card mt-4 flex flex-wrap items-end gap-2 border border-dashed p-3"
          >
            <input type="hidden" name="personId" value={person.id} />
            <select
              name="kind"
              aria-label={t('addRelation')}
              className="border-border rounded-button text-body focus:border-forest border px-3 py-2 outline-none"
            >
              <option value="ouder">{t('relKindParent')}</option>
              <option value="kind">{t('relKindChild')}</option>
              <option value="partner">{t('relKindPartner')}</option>
              <option value="broer_zus">{t('relKindSibling')}</option>
            </select>
            <select
              name="relatedPersonId"
              required
              aria-label={t('choosePerson')}
              className="border-border rounded-button text-body focus:border-forest min-w-0 flex-1 border px-3 py-2 outline-none"
            >
              <option value="">{t('choosePerson')}</option>
              {others.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-button bg-forest text-small px-4 py-2 font-medium text-white hover:opacity-90"
            >
              {t('addRelation')}
            </button>
          </form>
        ) : null}
      </section>

      {/* Familietak: deze persoon, of ook zijn kinderen. */}
      {person.hasChildren ? (
        <div className="mb-4 flex gap-2">
          <Link
            href={`/personen/${person.id}`}
            className={`rounded-pill text-small border px-3 py-1 font-medium ${
              !branch
                ? 'border-forest bg-forest text-white'
                : 'border-border text-ink-soft hover:bg-warm'
            }`}
          >
            {t('branchOff')}
          </Link>
          <Link
            href={`/personen/${person.id}?familie=1`}
            className={`rounded-pill text-small border px-3 py-1 font-medium ${
              branch
                ? 'border-forest bg-forest text-white'
                : 'border-border text-ink-soft hover:bg-warm'
            }`}
          >
            {t('branchOn')}
          </Link>
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          icon={<UserRound className="h-8 w-8" aria-hidden="true" />}
          title={t('emptyPersonTitle')}
          description={t('emptyPersonBody')}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.id} className="group relative">
              <MediaTile item={item} locale={locale} />
              {!branch ? (
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
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
