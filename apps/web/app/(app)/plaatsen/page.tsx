import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { MapPin } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { AutoRefreshImage } from '@/components/archive/AutoRefreshImage';
import { MemoryMap } from '@/components/map/MemoryMap';
import { getMapData } from '@/lib/archive/map';
import { listPlaces } from '@/lib/archive/places';

export const metadata = { title: 'Plaatsen' };

/**
 * Plaatsen — waar je herinneringen zijn gemaakt, op een echte kaart (getagde
 * plaatsen + foto's met GPS), met daaronder de plaatsen als lijst.
 */
export default async function PlacesPage() {
  const t = await getTranslations('map');
  const [data, places] = await Promise.all([getMapData(), listPlaces()]);
  const hasMap = data.places.length > 0 || data.items.length > 0;

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {!hasMap && places.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-8 w-8" aria-hidden="true" />}
          title={t('empty')}
          description={t('emptyBody')}
        />
      ) : (
        <div className="space-y-8">
          {hasMap ? (
            <MemoryMap
              places={data.places}
              items={data.items}
              labels={{ photo: t('photo'), photos: (n) => t('photoCount', { count: n }) }}
            />
          ) : null}

          {places.length > 0 ? (
            <section>
              <h2 className="text-h3 text-ink mb-3">{t('listTitle')}</h2>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {places.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/plaatsen/${p.id}`}
                      className="border-border rounded-card group block overflow-hidden border"
                    >
                      <span className="bg-warm relative block aspect-square overflow-hidden">
                        {p.coverThumbUrl ? (
                          <AutoRefreshImage
                            itemId={p.id}
                            src={p.coverThumbUrl}
                            alt=""
                            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                          />
                        ) : (
                          <span className="text-ink-soft flex h-full w-full items-center justify-center">
                            <MapPin className="h-7 w-7" aria-hidden="true" />
                          </span>
                        )}
                      </span>
                      <span className="block p-3">
                        <span className="text-body text-ink block truncate font-medium">
                          {p.name}
                        </span>
                        <span className="text-small text-ink-soft block">
                          {t('photoCount', { count: p.itemCount })}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
