import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { SubNav, PHOTO_SUBNAV } from '@/components/demo/SubNav';
import { CoverCard } from '@/components/demo/CoverCard';
import { isDemo } from '@/lib/demo/mode';
import { getPhoto } from '@/lib/demo/data';
import { resolveDemoMediaUrl } from '@/lib/demo/media';
import { peopleCards } from '@/lib/demo/queries';

export default function PeoplePage() {
  if (!isDemo()) notFound();

  const people = peopleCards();

  return (
    <div>
      <PageHeader title="Personen" subtitle="De mensen in je archief" />
      <SubNav items={PHOTO_SUBNAV} />

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {people.map((p) => {
          const c = p.coverId ? getPhoto(p.coverId) : null;
          const coverUrl = c ? resolveDemoMediaUrl(c.filename) : null;
          return (
            <li key={p.id}>
              <CoverCard
                href={`/fotos/personen/${p.id}`}
                coverUrl={coverUrl}
                title={p.name}
                subtitle={`${p.count} foto's`}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
