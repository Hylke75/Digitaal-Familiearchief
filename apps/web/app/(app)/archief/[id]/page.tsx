import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { ArrowLeft, Download, FileText, Pencil } from 'lucide-react';
import { formatBytes } from '@dla/shared';
import { Card, CardBody } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { FavouriteButton } from '@/components/archive/FavouriteButton';
import { AddToAlbum } from '@/components/archive/AddToAlbum';
import { MembershipPicker } from '@/components/archive/MembershipPicker';
import { getItemDetail } from '@/lib/archive/queries';
import { updateItemAction } from '@/lib/archive/item-actions';
import { formatDuration, stripExtension } from '@/lib/archive/display';
import { getAlbumMembership } from '@/lib/archive/albums';
import { getPersonMembership } from '@/lib/archive/people';
import { toggleItemPersonAction } from '@/lib/archive/people-actions';
import { getPlaceMembership } from '@/lib/archive/places';
import { toggleItemPlaceAction } from '@/lib/archive/places-actions';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const item = await getItemDetail(params.id);
  return { title: item ? stripExtension(item.filename) : 'Archief' };
}

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const item = await getItemDetail(params.id);
  if (!item) notFound();

  const f = await getFormatter();
  const t = await getTranslations('archive');
  const tAlbums = await getTranslations('albums');
  const tPeople = await getTranslations('people');
  const tPlaces = await getTranslations('places');
  const [membership, personMembership, placeMembership] = await Promise.all([
    getAlbumMembership(item.id),
    getPersonMembership(item.id),
    getPlaceMembership(item.id),
  ]);

  const rows: Array<[string, string]> = [];
  if (item.effectiveDate) {
    rows.push([t('metaDate'), f.dateTime(new Date(item.effectiveDate), { dateStyle: 'full' })]);
  }
  rows.push([t('metaType'), t(item.type)]);
  rows.push([t('metaSize'), formatBytes(item.fileSize)]);
  if (item.width && item.height) {
    rows.push([t('metaDimensions'), `${item.width} × ${item.height}`]);
  }
  if (item.durationMs) rows.push([t('metaDuration'), formatDuration(item.durationMs)]);
  if (item.camera) rows.push([t('metaCamera'), item.camera]);

  return (
    <div className="max-w-3xl">
      <Link
        href="/mijn-leven"
        className="text-ink-soft hover:text-ink text-small mb-4 inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('detailBack')}
      </Link>

      <div className="bg-warm rounded-card mb-5 flex items-center justify-center overflow-hidden">
        {item.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.previewUrl}
            alt={item.filename}
            className="max-h-[70vh] w-full object-contain"
          />
        ) : item.originalUrl && item.type === 'video' ? (
          <video src={item.originalUrl} controls className="max-h-[70vh] w-full" />
        ) : item.originalUrl && item.type === 'audio' ? (
          <audio src={item.originalUrl} controls className="w-full p-6" />
        ) : (
          <div className="text-ink-soft flex flex-col items-center gap-3 p-12 text-center">
            <FileText className="h-10 w-10" aria-hidden="true" />
            <p className="text-small">{t('noPreview')}</p>
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-h3 text-ink min-w-0 flex-1 font-semibold">
          {stripExtension(item.filename)}
        </h1>
        <FavouriteButton
          itemId={item.id}
          initial={item.favourite}
          addLabel={t('addFavourite')}
          removeLabel={t('removeFavourite')}
        />
        <AddToAlbum
          itemId={item.id}
          albums={membership.albums}
          memberOf={membership.memberOf}
          labels={{
            addToAlbum: tAlbums('addToAlbum'),
            noAlbumsYet: tAlbums('noAlbumsYet'),
            manageAlbums: tAlbums('manageAlbums'),
            done: tAlbums('done'),
          }}
        />
        <MembershipPicker
          itemId={item.id}
          entries={personMembership.people}
          memberOf={personMembership.memberOf}
          toggleAction={toggleItemPersonAction}
          labels={{
            button: tPeople('tag'),
            empty: tPeople('noneYet'),
            manage: tPeople('manage'),
            manageHref: '/personen',
            done: tPeople('done'),
          }}
        />
        <MembershipPicker
          itemId={item.id}
          entries={placeMembership.places}
          memberOf={placeMembership.memberOf}
          toggleAction={toggleItemPlaceAction}
          labels={{
            button: tPlaces('tag'),
            empty: tPlaces('noneYet'),
            manage: tPlaces('manage'),
            manageHref: '/plaatsen',
            done: tPlaces('done'),
          }}
        />
        <ButtonLink href={`/archief/download/${item.id}`} size="sm">
          <Download className="h-4 w-4" aria-hidden="true" />
          {t('download')}
        </ButtonLink>
      </div>

      <Card>
        <CardBody className="py-2">
          <dl className="divide-border divide-y">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-small text-ink-soft shrink-0">{label}</dt>
                <dd className="text-body text-ink min-w-0 text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      <details className="mt-4">
        <summary className="text-ink-soft hover:text-ink text-small inline-flex cursor-pointer list-none items-center gap-2 font-medium">
          <Pencil className="h-4 w-4" aria-hidden="true" />
          {t('edit')}
        </summary>
        <form action={updateItemAction} className="mt-3 max-w-md space-y-3">
          <input type="hidden" name="id" value={item.id} />
          <label className="block">
            <span className="text-small text-ink-soft mb-1 block">{t('titleLabel')}</span>
            <input
              name="title"
              defaultValue={stripExtension(item.filename)}
              maxLength={200}
              className="border-border rounded-button focus:border-forest text-body w-full border px-3 py-2 outline-none"
            />
          </label>
          <label className="block">
            <span className="text-small text-ink-soft mb-1 block">{t('metaDate')}</span>
            <input
              type="date"
              name="takenAt"
              defaultValue={item.effectiveDate ? item.effectiveDate.slice(0, 10) : ''}
              className="border-border rounded-button focus:border-forest text-body border px-3 py-2 outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded-button bg-forest text-small px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
          >
            {t('save')}
          </button>
        </form>
      </details>
    </div>
  );
}
