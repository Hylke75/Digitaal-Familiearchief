import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import { isDemo } from '@/lib/demo/mode';
import { demoMemories, getPhotosByIds, getDocumentsByIds } from '@/lib/demo/data';
import { formatDemoDate } from '@/lib/demo/dates';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { PhotoGrid } from '@/components/demo/PhotoGrid';
import { DocRow } from '@/components/demo/DocRow';

export default function MemoryDetailPage({ params }: { params: { id: string } }) {
  if (!isDemo()) notFound();

  const memory = demoMemories.find((m) => m.id === params.id);
  if (!memory) notFound();

  const photos = memory.photoIds.length > 0 ? getPhotosByIds(memory.photoIds) : [];
  const documents = memory.documentIds.length > 0 ? getDocumentsByIds(memory.documentIds) : [];
  const ext = memory.externalReference;

  return (
    <div>
      <Link
        href="/mijn-leven"
        className="text-ink-soft hover:text-ink text-small mb-4 inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Terug naar Mijn leven
      </Link>

      <PageHeader title={memory.title} />

      <p className="text-small text-ink-soft -mt-2 mb-4">
        {formatDemoDate(memory.date, memory.datePrecision)}
        {memory.place ? (
          <span className="ml-2 inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {memory.place}
          </span>
        ) : null}
      </p>

      <p className="text-body text-ink max-w-2xl leading-relaxed">{memory.story}</p>

      {photos.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-h3 text-ink mb-3">Foto&apos;s</h2>
          <PhotoGrid photos={photos} />
        </section>
      ) : null}

      {documents.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-h3 text-ink mb-3">Documenten</h2>
          <Card>
            <CardBody className="py-1">
              <ul className="divide-border divide-y">
                {documents.map((doc) => (
                  <DocRow key={doc.id} doc={doc} />
                ))}
              </ul>
            </CardBody>
          </Card>
        </section>
      ) : null}

      {ext ? (
        <section className="mt-8">
          <h2 className="text-h3 text-ink mb-3">Extern archieffragment</h2>
          <Card>
            <CardBody className="space-y-2">
              <span className="bg-soft-amber text-warning text-caption inline-flex rounded-full px-2 py-1 font-semibold">
                Demo — extern archieffragment
              </span>
              <dl className="text-small space-y-1.5">
                <div className="flex gap-2">
                  <dt className="text-ink-soft w-28 shrink-0">Aanbieder</dt>
                  <dd className="text-ink">Beeld &amp; Geluid</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-ink-soft w-28 shrink-0">Programma</dt>
                  <dd className="text-ink">{ext.programme}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-ink-soft w-28 shrink-0">Datum</dt>
                  <dd className="text-ink">{formatDemoDate(ext.date, 'DATE')}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-ink-soft w-28 shrink-0">Fragment</dt>
                  <dd className="text-ink">
                    {ext.fragmentStart}–{ext.fragmentEnd}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
