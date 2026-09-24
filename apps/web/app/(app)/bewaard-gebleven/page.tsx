import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Shield } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { AutoRefreshImage } from '@/components/archive/AutoRefreshImage';
import { listPreservedGroups } from '@/lib/archive/preserved';
import { stripExtension } from '@/lib/archive/display';

export const metadata = { title: 'Bewaard gebleven' };

/**
 * The full "Bewaard gebleven" overview: what disappeared at the source but is
 * still safe here, grouped by source, each item with the date the disappearance
 * was observed. The tone is reassuring — no alarm colours, no exclamation marks.
 */
export default async function PreservedPage() {
  const t = await getTranslations('preserved');
  const f = await getFormatter();
  const groups = await listPreservedGroups();

  if (groups.length === 0) {
    return (
      <div>
        <PageHeader title={t('pageTitle')} subtitle={t('pageSubtitle')} />
        <EmptyState
          icon={<Shield className="h-8 w-8" aria-hidden="true" />}
          title={t('pageTitle')}
          description={t('pageSubtitle')}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('pageTitle')} subtitle={t('pageSubtitle')} />
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.sourceName}>
            <h2 className="text-h3 text-ink mb-3">{group.sourceName}</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {group.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/archief/${item.id}`}
                    className="rounded-card group block overflow-hidden"
                  >
                    <span className="bg-warm relative flex aspect-square items-center justify-center overflow-hidden rounded-[4px]">
                      {item.thumbUrl ? (
                        <AutoRefreshImage
                          itemId={item.id}
                          src={item.thumbUrl}
                          alt={stripExtension(item.filename)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-ink-soft p-2 text-center text-[11px] leading-tight">
                          {stripExtension(item.filename)}
                        </span>
                      )}
                    </span>
                    <span className="text-caption text-ink-soft mt-1 block truncate">
                      {t('sinceDate', {
                        date: f.dateTime(new Date(item.deletedAt), { dateStyle: 'medium' }),
                      })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
