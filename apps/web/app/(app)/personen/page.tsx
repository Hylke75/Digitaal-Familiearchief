import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { UserRound, Users } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { listPeople } from '@/lib/archive/people';
import { createPersonAction } from '@/lib/archive/people-actions';

export default async function PeoplePage() {
  const t = await getTranslations('people');
  const people = await listPeople();

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <form action={createPersonAction} className="mb-6 flex max-w-md gap-2">
        <input
          name="name"
          required
          maxLength={120}
          placeholder={t('namePlaceholder')}
          aria-label={t('namePlaceholder')}
          className="border-border rounded-button focus:border-forest text-body flex-1 border px-3 py-2 outline-none"
        />
        <button
          type="submit"
          className="rounded-button bg-forest text-small px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
        >
          {t('create')}
        </button>
      </form>

      {people.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" aria-hidden="true" />}
          title={t('emptyTitle')}
          description={t('emptyBody')}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {people.map((person) => (
            <li key={person.id}>
              <Link href={`/personen/${person.id}`} className="group block">
                <Card className="overflow-hidden">
                  <div className="bg-warm relative aspect-square">
                    {person.coverThumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={person.coverThumbUrl}
                        alt={person.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="text-ink-soft/50 flex h-full w-full items-center justify-center">
                        <UserRound className="h-8 w-8" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <CardBody className="py-2">
                    <p className="text-ink truncate font-medium">{person.name}</p>
                    <p className="text-small text-ink-soft">
                      {t('count', { count: person.itemCount })}
                    </p>
                  </CardBody>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
