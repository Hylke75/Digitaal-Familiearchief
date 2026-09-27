import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { SubNav, PHOTO_SUBNAV } from '@/components/demo/SubNav';
import { CoverCard } from '@/components/demo/CoverCard';
import { PlacesMap } from '@/components/demo/PlacesMap';
import { isDemo } from '@/lib/demo/mode';
import { getPhoto } from '@/lib/demo/data';
import { resolveDemoMediaUrl } from '@/lib/demo/media';
import { placeBuckets } from '@/lib/demo/queries';

export default function PlacesPage() {
  if (!isDemo()) notFound();

  const buckets = placeBuckets();

  const points = buckets
    .filter((b) => b.centroid !== null)
    .map((b) => ({
      name: b.name,
      lat: b.centroid!.lat,
      lng: b.centroid!.lng,
      count: b.count,
      href: `/fotos/plaatsen/${encodeURIComponent(b.name)}`,
    }));

  return (
    <div>
      <PageHeader title="Plaatsen" subtitle="Waar je herinneringen zijn gemaakt" />
      <SubNav items={PHOTO_SUBNAV} />

      {points.length ? (
        <div className="mb-6">
          <PlacesMap points={points} />
        </div>
      ) : null}

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {buckets.map((b) => {
          const c = b.coverId ? getPhoto(b.coverId) : null;
          const coverUrl = c ? resolveDemoMediaUrl(c.filename) : null;
          return (
            <li key={b.name}>
              <CoverCard
                href={`/fotos/plaatsen/${encodeURIComponent(b.name)}`}
                coverUrl={coverUrl}
                title={b.name}
                subtitle={`${b.count} foto's`}
                sources={b.sources}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
