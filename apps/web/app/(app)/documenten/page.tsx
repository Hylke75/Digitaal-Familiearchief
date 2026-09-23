import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { listDocuments } from '@/lib/archive/documents';
import { expiryStatus } from '@/lib/archive/expiry';

export const metadata = { title: 'Documenten' };

/**
 * Documents get their own environment, ordered by life area rather than by date
 * (design advice, Advice B): you look up the bike warranty under "Aankopen",
 * not under "May 2026". Each card shows the sender + document date, not a file
 * size.
 */
export default async function DocumentsPage() {
  const t = await getTranslations();
  const f = await getFormatter();
  const areas = await listDocuments();
  const total = areas.reduce((n, a) => n + a.documents.length, 0);

  if (total === 0) {
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

  return (
    <div>
      <PageHeader title={t('nav.documents')} subtitle={t('archive.memories', { count: total })} />
      <div className="space-y-8">
        {areas.map(({ area, documents }) => (
          <section key={area}>
            <h2 className="text-h3 text-ink mb-3">{area}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {documents.map((doc) => {
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
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={doc.previewUrl}
                            alt=""
                            loading="lazy"
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
          </section>
        ))}
      </div>
    </div>
  );
}
