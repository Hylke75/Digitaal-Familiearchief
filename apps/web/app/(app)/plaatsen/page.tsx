import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { MapPin } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { listPlaces } from '@/lib/archive/places';
import { createPlaceAction } from '@/lib/archive/places-actions';

export default async function PlacesPage() {
  const t = await getTranslations('places');
  const places = await listPlaces();

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <form action={createPlaceAction} className="mb-6 flex max-w-md gap-2">
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

      {places.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-8 w-8" aria-hidden="true" />}
          title={t('emptyTitle')}
          description={t('emptyBody')}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {places.map((place) => (
            <li key={place.id}>
              <Link href={`/plaatsen/${place.id}`} className="group block">
                <Card className="overflow-hidden">
                  <div className="bg-warm relative aspect-square">
                    {place.coverThumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={place.coverThumbUrl}
                        alt={place.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="text-ink-soft/50 flex h-full w-full items-center justify-center">
                        <MapPin className="h-8 w-8" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <CardBody className="py-2">
                    <p className="text-ink truncate font-medium">{place.name}</p>
                    <p className="text-small text-ink-soft">
                      {t('count', { count: place.itemCount })}
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
