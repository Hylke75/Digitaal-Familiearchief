import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, Film, Tag } from 'lucide-react';
import { formatBytes } from '@dla/shared';
import { isDemo } from '@/lib/demo/mode';
import { getDocument } from '@/lib/demo/data';
import { demoMemories } from '@/lib/demo/data';
import { formatDemoDate } from '@/lib/demo/dates';
import { resolveDemoDocUrl } from '@/lib/demo/media';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';

export default function DocumentItemPage({ params }: { params: { id: string } }) {
  if (!isDemo()) notFound();

  const doc = getDocument(params.id);
  if (!doc) notFound();

  const url = resolveDemoDocUrl(doc.placeholder);
  const memory = demoMemories.find((m) => m.documentIds.includes(doc.id));

  return (
    <div>
      <Link
        href="/documenten"
        className="text-ink-soft hover:text-ink text-small mb-4 inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Terug naar documenten
      </Link>

      <PageHeader
        title={doc.title}
        action={
          <ButtonLink href={url} download variant="secondary">
            <Download className="h-4 w-4" aria-hidden="true" /> Download
          </ButtonLink>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardBody>
            <iframe
              src={url}
              className="rounded-card border-border h-[480px] w-full border"
              title={doc.title}
            />
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardBody>
              <dl className="divide-border grid grid-cols-1 divide-y">
                <MetaRow label="Documentdatum" value={formatDemoDate(doc.documentDate, 'DATE')} />
                <MetaRow label="Categorie" value={doc.category} />
                <MetaRow label="Bron" value={doc.sourceLabel} />
                <MetaRow label="Oorspronkelijke map" value={doc.folder ?? 'Handmatig toegevoegd'} />
                <MetaRow label="Bestandstype" value={doc.mimeType} />
                <MetaRow label="Bestandsgrootte" value={formatBytes(doc.fileSize)} />
                <div className="py-3">
                  <dt className="text-small text-ink-soft">Tags</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {doc.tags.length > 0 ? (
                      doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-warm text-ink-soft text-caption inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                        >
                          <Tag className="h-3 w-3" aria-hidden="true" /> {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-small text-ink-soft">Geen tags</span>
                    )}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          {memory ? (
            <Card>
              <CardBody>
                <Link
                  href={`/mijn-leven/${memory.id}`}
                  className="text-forest text-body inline-flex items-center gap-2 font-semibold"
                >
                  <Film className="h-4.5 w-4.5" aria-hidden="true" />
                  Onderdeel van: {memory.title}
                </Link>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>

      <p className="text-caption text-ink-soft mt-5">
        Categorie, tags en het koppelen aan gebeurtenissen zijn beschikbaar in het echte archief.
      </p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-small text-ink-soft shrink-0">{label}</dt>
      <dd className="text-body text-ink text-right">{value}</dd>
    </div>
  );
}
