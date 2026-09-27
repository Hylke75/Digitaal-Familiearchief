import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { SubNav, PHOTO_SUBNAV } from '@/components/demo/SubNav';
import { PhotoGrid } from '@/components/demo/PhotoGrid';
import { isDemo } from '@/lib/demo/mode';
import { demoPhotos } from '@/lib/demo/data';
import { NO_LOCATION, sortPhotos } from '@/lib/demo/queries';

export default function PlaceDetailPage({ params }: { params: { region: string } }) {
  if (!isDemo()) notFound();

  const region = decodeURIComponent(params.region);
  const photos = sortPhotos(
    demoPhotos.filter((p) => (p.region ?? NO_LOCATION) === region),
    'captured_desc',
  );

  if (!photos.length) notFound();

  const sourceLabels = [...new Set(photos.flatMap((p) => p.sources.map((s) => s.label)))];
  const subtitle = `${photos.length} foto's · uit ${sourceLabels.join(', ')}`;

  return (
    <div>
      <Link
        href="/fotos/plaatsen"
        className="text-ink-soft hover:text-ink text-small mb-4 inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Terug naar plaatsen
      </Link>

      <PageHeader title={region} subtitle={subtitle} />
      <SubNav items={PHOTO_SUBNAV} />

      <PhotoGrid photos={photos} />
    </div>
  );
}
