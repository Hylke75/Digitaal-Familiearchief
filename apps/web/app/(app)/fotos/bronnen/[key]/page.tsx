import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { SubNav, PHOTO_SUBNAV } from '@/components/demo/SubNav';
import { PhotoGrid } from '@/components/demo/PhotoGrid';
import { isDemo } from '@/lib/demo/mode';
import { queryPhotos, PHOTO_SOURCE_LABELS } from '@/lib/demo/queries';

export default function SourceDetailPage({ params }: { params: { key: string } }) {
  if (!isDemo()) notFound();

  const photos = queryPhotos({ source: params.key }, 'captured_desc');
  if (!photos.length) notFound();

  const title = PHOTO_SOURCE_LABELS[params.key] ?? params.key;

  return (
    <div>
      <Link
        href="/fotos/bronnen"
        className="text-ink-soft hover:text-ink text-small mb-4 inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Terug naar bronnen
      </Link>

      <PageHeader title={title} subtitle={`${photos.length} foto's afkomstig uit ${title}`} />
      <SubNav items={PHOTO_SUBNAV} />

      <p className="text-small text-ink-soft mb-4">
        Dit is hetzelfde archief, alleen gefilterd op deze bron.
      </p>

      <PhotoGrid photos={photos} />
    </div>
  );
}
