import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft, Images, Settings2, X } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { MediaTile } from '@/components/archive/MediaTile';
import { getAlbum } from '@/lib/archive/albums';
import {
  deleteAlbumAction,
  removeFromAlbumAction,
  renameAlbumAction,
} from '@/lib/archive/album-actions';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const album = await getAlbum(params.id);
  return { title: album?.title ?? 'Album' };
}

export default async function AlbumDetailPage({ params }: { params: { id: string } }) {
  const album = await getAlbum(params.id);
  if (!album) notFound();

  const locale = await getLocale();
  const t = await getTranslations('albums');
  const tNav = await getTranslations('nav');

  return (
    <div>
      <Link
        href="/albums"
        className="text-ink-soft hover:text-ink text-small mb-4 inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {tNav('albums')}
      </Link>

      <PageHeader title={album.title} subtitle={t('count', { count: album.items.length })} />

      <details className="mb-6">
        <summary className="text-ink-soft hover:text-ink text-small inline-flex cursor-pointer list-none items-center gap-2 font-medium">
          <Settings2 className="h-4 w-4" aria-hidden="true" />
          {t('rename')}
        </summary>
        <div className="mt-3 space-y-3">
          <form action={renameAlbumAction} className="flex max-w-md gap-2">
            <input type="hidden" name="albumId" value={album.id} />
            <input
              name="title"
              defaultValue={album.title}
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
          <form action={deleteAlbumAction}>
            <input type="hidden" name="albumId" value={album.id} />
            <button type="submit" className="text-danger text-small font-medium hover:underline">
              {t('deleteAlbum')}
            </button>
          </form>
        </div>
      </details>

      {album.items.length === 0 ? (
        <EmptyState
          icon={<Images className="h-8 w-8" aria-hidden="true" />}
          title={t('emptyAlbumTitle')}
          description={t('emptyAlbumBody')}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {album.items.map((item) => (
            <li key={item.id} className="group relative">
              <MediaTile item={item} locale={locale} />
              <form
                action={removeFromAlbumAction}
                className="absolute left-2 top-2 z-30 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
              >
                <input type="hidden" name="albumId" value={album.id} />
                <input type="hidden" name="itemId" value={item.id} />
                <button
                  type="submit"
                  aria-label={t('removeFromAlbum')}
                  title={t('removeFromAlbum')}
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
