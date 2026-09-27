import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { SubNav, PHOTO_SUBNAV } from '@/components/demo/SubNav';
import { PhotoGrid } from '@/components/demo/PhotoGrid';
import { isDemo } from '@/lib/demo/mode';
import { getPerson, demoPhotos } from '@/lib/demo/data';
import { sortPhotos } from '@/lib/demo/queries';

export default function PersonDetailPage({ params }: { params: { id: string } }) {
  if (!isDemo()) notFound();

  const person = getPerson(params.id);
  if (!person) notFound();

  const photos = sortPhotos(
    demoPhotos.filter((p) => p.people.includes(person.name)),
    'captured_desc',
  );

  return (
    <div>
      <Link
        href="/fotos/personen"
        className="text-ink-soft hover:text-ink text-small mb-4 inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Terug naar personen
      </Link>

      <PageHeader title={person.name} subtitle={`${person.role} · ${photos.length} foto's`} />
      <SubNav items={PHOTO_SUBNAV} />

      <PhotoGrid photos={photos} />
    </div>
  );
}
