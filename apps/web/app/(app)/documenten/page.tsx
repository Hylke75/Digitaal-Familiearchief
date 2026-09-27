import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { ArrowUp, ChevronRight, FileText, Folder, House } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { SourceLogo } from '@/components/marketing/SourceLogo';
import { listDocumentCards } from '@/lib/archive/documents';
import {
  breadcrumbs,
  decodePath,
  encodePath,
  folderView,
  type SubFolder,
} from '@/lib/archive/document-tree';
import { expiryStatus } from '@/lib/archive/expiry';
import { AutoRefreshImage } from '@/components/archive/AutoRefreshImage';

export const metadata = { title: 'Documenten' };

const folderHref = (path: string[]) =>
  path.length ? `/documenten?pad=${encodeURIComponent(encodePath(path))}` : '/documenten';

/** Bronlabel (afzender) → connector-sleutel voor het bronlogo. */
const SOURCE_KEY: Record<string, string> = {
  'google drive': 'google_drive',
  onedrive: 'onedrive',
  dropbox: 'dropbox',
  'google photos': 'google_photos',
  "google foto's": 'google_photos',
  "apple foto's": 'apple_photos',
  instagram: 'instagram',
  facebook: 'facebook',
  whatsapp: 'whatsapp',
  tiktok: 'tiktok',
};
const sourceKey = (label: string | null): string | null =>
  label ? (SOURCE_KEY[label.trim().toLowerCase()] ?? null) : null;

/**
 * Documenten als mappenboom, net als Google Drive: mappen om in te klikken,
 * bestanden in de huidige map, en een kruimelpad om terug te navigeren. De boom
 * komt uit het bronpad van elk document (waar het bij de bron stond).
 */
export default async function DocumentsPage({ searchParams }: { searchParams: { pad?: string } }) {
  const t = await getTranslations();
  const f = await getFormatter();
  const cards = await listDocumentCards();

  if (cards.length === 0) {
    return (
      <div>
        <PageHeader title={t('nav.documents')} />
        <EmptyState
          icon={<FileText className="h-8 w-8" aria-hidden="true" />}
          title={t('emptyStates.documentsTitle')}
          description={t('emptyStates.documentsBody')}
          action={<ButtonLink href="/bronnen">{t('sources.connect')}</ButtonLink>}
        />
      </div>
    );
  }

  const current = decodePath(searchParams.pad);
  // Bronlabel meegeven zodat elke map het logo van zijn dominante bron toont.
  const treeCards = cards.map((c) => ({ ...c, source: c.sender }));
  const { folders, files } = folderView(treeCards, current);
  const crumbs = breadcrumbs(current);
  const parentHref = folderHref(current.slice(0, -1));

  return (
    <div>
      <PageHeader
        title={t('nav.documents')}
        subtitle={t('archive.memories', { count: cards.length })}
      />

      {/* Kruimelpad */}
      <nav aria-label="Mappad" className="text-small mb-5 flex flex-wrap items-center gap-1">
        {current.length > 0 ? (
          <Link
            href={parentHref}
            aria-label={t('documents.up')}
            title={t('documents.up')}
            className="border-border text-ink-soft hover:bg-warm mr-1 inline-flex items-center gap-1.5 rounded-md border px-2 py-1"
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
            {t('documents.up')}
          </Link>
        ) : null}
        <Link
          href="/documenten"
          className={`hover:bg-warm inline-flex items-center gap-1.5 rounded-md px-2 py-1 ${
            current.length === 0 ? 'text-ink font-medium' : 'text-ink-soft'
          }`}
        >
          <House className="h-4 w-4" aria-hidden="true" />
          {t('nav.documents')}
        </Link>
        {crumbs.map((c, i) => (
          <span key={c.path.join('/')} className="inline-flex items-center gap-1">
            <ChevronRight className="text-ink-soft h-4 w-4" aria-hidden="true" />
            <Link
              href={folderHref(c.path)}
              className={`hover:bg-warm rounded-md px-2 py-1 ${
                i === crumbs.length - 1 ? 'text-ink font-medium' : 'text-ink-soft'
              }`}
            >
              {c.name}
            </Link>
          </span>
        ))}
      </nav>

      {folders.length === 0 && files.length === 0 ? (
        <EmptyState
          icon={<Folder className="h-8 w-8" aria-hidden="true" />}
          title={t('documents.emptyFolder')}
          description={t('documents.emptyFolderBody')}
        />
      ) : (
        <div className="space-y-8">
          {/* Mappen */}
          {folders.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {folders.map((folder: SubFolder) => {
                const key = sourceKey(folder.source);
                return (
                  <li key={folder.name}>
                    <Link
                      href={folderHref(folder.path)}
                      className="border-border rounded-card hover:border-forest/40 hover:bg-warm flex items-center gap-3 border p-4 transition-colors"
                    >
                      <Folder className="text-forest h-8 w-8 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="text-ink block truncate font-medium">{folder.name}</span>
                        <span className="text-small text-ink-soft block">
                          {t('documents.folderItems', { count: folder.count })}
                        </span>
                      </span>
                      {key ? (
                        <SourceLogo
                          connectorKey={key}
                          fallback={folder.source ?? ''}
                          className="h-5 w-5 shrink-0 opacity-80"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {/* Bestanden in deze map */}
          {files.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {files.map((doc) => {
                const meta = [
                  doc.sender,
                  doc.documentDate
                    ? f.dateTime(new Date(doc.documentDate), { dateStyle: 'medium' })
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ');
                const s = expiryStatus(doc.expiresAt, Date.now());
                return (
                  <li key={doc.id}>
                    <Link
                      href={`/archief/${doc.id}`}
                      className="border-border rounded-card hover:border-forest/40 group block overflow-hidden border transition-colors"
                    >
                      <span className="bg-warm relative flex aspect-[3/4] items-center justify-center overflow-hidden">
                        {doc.previewUrl ? (
                          <AutoRefreshImage
                            itemId={doc.id}
                            src={doc.previewUrl}
                            alt=""
                            className="h-full w-full bg-white object-cover object-top"
                          />
                        ) : (
                          <FileText className="text-forest/60 h-10 w-10" aria-hidden="true" />
                        )}
                        {s === 'expired' || s === 'soon' ? (
                          <span
                            className={`rounded-pill text-caption absolute left-2 top-2 px-2 py-0.5 font-medium ${
                              s === 'expired'
                                ? 'bg-danger/10 text-danger'
                                : 'bg-brass/10 text-brass'
                            }`}
                          >
                            {s === 'expired' ? t('archive.expired') : t('archive.expiresSoon')}
                          </span>
                        ) : null}
                      </span>
                      <span className="block p-3">
                        <span className="text-ink line-clamp-2 font-medium leading-snug">
                          {doc.title}
                        </span>
                        {meta ? (
                          <span className="text-small text-ink-soft mt-0.5 block truncate">
                            {meta}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
