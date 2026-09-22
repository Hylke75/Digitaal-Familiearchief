import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Images } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { listAlbums } from '@/lib/archive/albums';
import { createAlbumAction } from '@/lib/archive/album-actions';

export default async function AlbumsPage() {
  const t = await getTranslations('albums');
  const albums = await listAlbums();

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <form action={createAlbumAction} className="mb-6 flex max-w-md gap-2">
        <input
          name="title"
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

      {albums.length === 0 ? (
        <EmptyState
          icon={<Images className="h-8 w-8" aria-hidden="true" />}
          title={t('emptyTitle')}
          description={t('emptyBody')}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {albums.map((album) => (
            <li key={album.id}>
              <Link href={`/albums/${album.id}`} className="group block">
                <Card className="overflow-hidden">
                  <div className="bg-warm relative aspect-square">
                    {album.coverThumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={album.coverThumbUrl}
                        alt={album.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="text-ink-soft/50 flex h-full w-full items-center justify-center">
                        <Images className="h-8 w-8" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <CardBody className="py-2">
                    <p className="text-ink truncate font-medium">{album.title}</p>
                    <p className="text-small text-ink-soft">
                      {t('count', { count: album.itemCount })}
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
