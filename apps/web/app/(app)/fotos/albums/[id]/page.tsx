import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { SubNav, PHOTO_SUBNAV } from '@/components/demo/SubNav';
import { PhotoGrid } from '@/components/demo/PhotoGrid';
import { isDemo } from '@/lib/demo/mode';
import { demoPhotos, demoAlbums } from '@/lib/demo/data';
import { smartAlbumById, filterPhotos, sortPhotos } from '@/lib/demo/queries';
import type { DemoPhoto } from '@/lib/demo/types';

export default function AlbumDetailPage({ params }: { params: { id: string } }) {
  if (!isDemo()) notFound();

  let title: string;
  let items: DemoPhoto[];

  if (params.id.startsWith('smart-')) {
    const result = smartAlbumById(params.id);
    if (!result) notFound();
    title = result.album.title;
    items = result.items;
  } else {
    const album = demoAlbums.find((a) => a.id === params.id);
    if (!album) notFound();
    title = album.title;
    items = sortPhotos(filterPhotos(demoPhotos, { album: album.title }), 'captured_desc');
  }

  if (!items.length) notFound();

  const sourceLabels = [...new Set(items.flatMap((p) => p.sources.map((s) => s.label)))];
  const subtitle = `${items.length} foto's · uit ${sourceLabels.join(', ')}`;

  return (
    <div>
      <Link
        href="/fotos/albums"
        className="text-ink-soft hover:text-ink text-small mb-4 inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Terug naar albums
      </Link>

      <PageHeader title={title} subtitle={subtitle} />
      <SubNav items={PHOTO_SUBNAV} />

      <PhotoGrid photos={items} />
    </div>
  );
}
