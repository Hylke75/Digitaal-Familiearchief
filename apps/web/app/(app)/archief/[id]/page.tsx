import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { formatBytes } from '@dla/shared';
import { Card, CardBody } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { FavouriteButton } from '@/components/archive/FavouriteButton';
import { getItemDetail } from '@/lib/archive/queries';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const item = await getItemDetail(params.id);
  return { title: item?.filename ?? 'Archief' };
}

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const item = await getItemDetail(params.id);
  if (!item) notFound();

  const f = await getFormatter();
  const t = await getTranslations('archive');

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
        <h1 className="text-h3 text-ink min-w-0 flex-1 truncate font-semibold">{item.filename}</h1>
        <FavouriteButton
          itemId={item.id}
          initial={item.favourite}
          addLabel={t('addFavourite')}
          removeLabel={t('removeFavourite')}
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
    </div>
  );
}
