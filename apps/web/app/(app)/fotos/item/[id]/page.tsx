import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Download,
  Heart,
  Images,
  Layers,
  MapPin,
  Tag,
  Users,
} from 'lucide-react';
import { isDemo } from '@/lib/demo/mode';
import { getPhoto, demoAlbums, demoPeople } from '@/lib/demo/data';
import { resolveDemoMediaUrl } from '@/lib/demo/media';
import { sourcesForDetail } from '@/lib/demo/queries';
import { formatDemoDate } from '@/lib/demo/dates';
import { Card, CardBody } from '@/components/ui/Card';

const LOCATION_SOURCE_LABEL: Record<string, string> = {
  EXIF: 'uit de foto (EXIF)',
  PROVIDER: 'van de bron',
  USER: 'door jou ingesteld',
  INFERRED: 'afgeleid (niet geverifieerd)',
  UNKNOWN: 'onbekend',
};

function albumIdByTitle(title: string) {
  return demoAlbums.find((a) => a.title === title)?.id;
}
function personIdByName(name: string) {
  return demoPeople.find((p) => p.name === name)?.id;
}

export default function MediaDetailPage({ params }: { params: { id: string } }) {
  if (!isDemo()) notFound();
  const photo = getPhoto(params.id);
  if (!photo) notFound();

  const prov = sourcesForDetail(photo);
  const placeText = photo.place ?? photo.city ?? photo.country ?? null;

  return (
    <div>
      <Link
        href="/fotos"
        className="text-ink-soft hover:text-ink text-small mb-4 inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Terug naar foto&apos;s
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Immersive viewer */}
        <div className="rounded-card overflow-hidden bg-black/90">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveDemoMediaUrl(photo.filename)}
            alt={photo.title}
            className="mx-auto max-h-[70vh] w-full object-contain"
          />
        </div>

        {/* Metadata panel */}
        <div className="space-y-4">
          <div>
            <h1 className="text-h3 flex items-start gap-2">
              {photo.title}
              {photo.favorite ? (
                <Heart
                  className="text-brass mt-1 h-5 w-5 shrink-0 fill-current"
                  aria-label="Favoriet"
                />
              ) : null}
            </h1>
          </div>

          <Card>
            <CardBody className="text-small space-y-3">
              <Row icon={Calendar} label="Datum">
                {formatDemoDate(photo.capturedAt, photo.datePrecision)}
                {photo.datePrecision === 'YEAR' ? (
                  <span className="text-ink-soft"> · alleen jaar bekend</span>
                ) : null}
              </Row>

              {placeText ? (
                <Row icon={MapPin} label="Plaats">
                  {photo.region ? (
                    <Link
                      href={`/fotos/plaatsen/${encodeURIComponent(photo.region)}`}
                      className="text-forest underline underline-offset-2"
                    >
                      {placeText}
                    </Link>
                  ) : (
                    placeText
                  )}
                  <span className="text-ink-soft">
                    {' '}
                    · {LOCATION_SOURCE_LABEL[photo.locationSource]}
                  </span>
                  {photo.providerPlace ? (
                    <span className="text-ink-soft block">
                      Bron gaf &ldquo;{photo.providerPlace}&rdquo; — jouw aanpassing wordt getoond.
                    </span>
                  ) : null}
                </Row>
              ) : null}

              {photo.people.length ? (
                <Row icon={Users} label="Personen">
                  <span className="flex flex-wrap gap-x-1.5">
                    {photo.people.map((name, i) => {
                      const pid = personIdByName(name);
                      return (
                        <span key={name}>
                          {pid ? (
                            <Link
                              href={`/fotos/personen/${pid}`}
                              className="text-forest underline underline-offset-2"
                            >
                              {name}
                            </Link>
                          ) : (
                            name
                          )}
                          {i < photo.people.length - 1 ? ',' : ''}
                        </span>
                      );
                    })}
                  </span>
                </Row>
              ) : null}

              {photo.albums.length ? (
                <Row icon={Images} label="Albums">
                  <span className="flex flex-wrap gap-x-1.5">
                    {photo.albums.map((title, i) => {
                      const aid = albumIdByTitle(title);
                      return (
                        <span key={title}>
                          {aid ? (
                            <Link
                              href={`/fotos/albums/${aid}`}
                              className="text-forest underline underline-offset-2"
                            >
                              {title}
                            </Link>
                          ) : (
                            title
                          )}
                          {i < photo.albums.length - 1 ? ',' : ''}
                        </span>
                      );
                    })}
                  </span>
                </Row>
              ) : null}

              {photo.tags.length ? (
                <Row icon={Tag} label="Labels">
                  {photo.tags.join(', ')}
                </Row>
              ) : null}
            </CardBody>
          </Card>

          {/* Provenance (§29, §48, §62) */}
          <Card>
            <CardBody className="space-y-2">
              <p className="text-small text-ink flex items-center gap-1.5 font-semibold">
                <Layers className="h-4 w-4" aria-hidden="true" />
                Herkomst · {prov.count} {prov.count === 1 ? 'bron' : 'bronnen'}
              </p>
              <ul className="text-small space-y-1">
                <li>
                  <span className="text-ink-soft">Origineel:</span>{' '}
                  <span className="font-medium">{prov.origin?.label}</span>
                </li>
                {prov.alsoFoundIn.map((s) => (
                  <li key={s.key}>
                    <span className="text-ink-soft">Ook gevonden in:</span>{' '}
                    <span className="font-medium">{s.label}</span>
                  </li>
                ))}
                {prov.deleted.map((s) => (
                  <li key={s.key} className="text-ink-soft">
                    Bij {s.label} verwijderd — je archiefkopie blijft bewaard.
                  </li>
                ))}
              </ul>
              <p className="text-caption text-ink-soft">
                Eén foto, meerdere bronnen — hij verschijnt maar één keer in je archief.
              </p>
            </CardBody>
          </Card>

          {/* Versions (§8) */}
          {photo.versions.length ? (
            <Card>
              <CardBody className="space-y-2">
                <p className="text-small text-ink font-semibold">Versies</p>
                <ul className="text-small space-y-1">
                  <li>
                    <span className="font-medium">Origineel</span>
                    <span className="text-ink-soft"> · {prov.origin?.label}</span>
                  </li>
                  {photo.versions.map((v) => (
                    <li key={v.id}>
                      <span className="font-medium">{v.label}</span>
                      {v.note ? <span className="text-ink-soft"> · {v.note}</span> : null}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          {/* Technical + actions */}
          <Card>
            <CardBody className="space-y-3">
              <dl className="text-small grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-ink-soft">Afmetingen</dt>
                  <dd>
                    {photo.width} × {photo.height}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-soft">Type</dt>
                  <dd>Foto</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-ink-soft">Oorspronkelijke bestandsnaam</dt>
                  <dd className="truncate">{photo.filename}</dd>
                </div>
              </dl>
              <a
                href={resolveDemoMediaUrl(photo.filename)}
                download
                className="rounded-button bg-forest hover:bg-forest-hover text-body inline-flex h-11 items-center gap-2 px-5 font-semibold text-white"
              >
                <Download className="h-4 w-4" aria-hidden="true" /> Download origineel
              </a>
              <p className="text-caption text-ink-soft">
                In het echte archief kun je ook favoriet maken, aan een album toevoegen en datum of
                plaats aanpassen.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Calendar;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <Icon className="text-ink-soft mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        <span className="text-ink-soft">{label}: </span>
        {children}
      </div>
    </div>
  );
}
