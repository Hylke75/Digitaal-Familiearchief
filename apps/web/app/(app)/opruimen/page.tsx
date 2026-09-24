import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { AutoRefreshImage } from '@/components/archive/AutoRefreshImage';
import { MergeButton } from '@/components/dedup/MergeButton';
import { detectDuplicates, listPendingMerges, type DupGroup } from '@/lib/archive/dedup';
import { undoDedupAction } from '@/lib/archive/dedup-actions';
import type { MediaCard } from '@/lib/archive/queries';
import { stripExtension } from '@/lib/archive/display';

export const metadata = { title: 'Opruimen' };

function Thumb({ item, keeper, label }: { item: MediaCard; keeper?: boolean; label?: string }) {
  return (
    <Link
      href={`/archief/${item.id}`}
      className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-[4px]"
    >
      <span className="bg-warm flex h-full w-full items-center justify-center">
        {item.thumbUrl ? (
          <AutoRefreshImage
            itemId={item.id}
            src={item.thumbUrl}
            alt={stripExtension(item.filename)}
            className="h-full w-full object-cover"
          />
        ) : null}
      </span>
      {keeper ? (
        <span className="bg-forest text-caption absolute inset-x-0 bottom-0 py-0.5 text-center font-medium text-white">
          {label}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * Opruimen — dubbelingen samenvoegen om het archief beter te maken (functie #9).
 * Rustige toon, geen waarschuwingskleuren. Bestandsgrootte tonen we niet (Blok
 * 0); we tellen dubbelingen, geen gigabytes.
 */
export default async function DedupPage() {
  const t = await getTranslations('dedup');
  const [result, pending] = await Promise.all([detectDuplicates(), listPendingMerges()]);
  const { identical, nearIdentical, series, duplicateCount } = result;

  const nothing =
    identical.length === 0 &&
    nearIdentical.length === 0 &&
    series.length === 0 &&
    pending.length === 0;

  if (nothing) {
    return (
      <div>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <EmptyState
          icon={<Sparkles className="h-8 w-8" aria-hidden="true" />}
          title={t('empty')}
          description={t('subtitle')}
        />
      </div>
    );
  }

  const mergeGroup = (g: DupGroup) => {
    const dupIds = g.items.map((i) => i.id).filter((id) => id !== g.keeperId);
    return (
      <li
        key={g.keeperId}
        className="border-border rounded-card flex flex-wrap items-center gap-3 border p-3"
      >
        <div className="flex flex-wrap gap-2">
          {g.items.map((item) => (
            <Thumb key={item.id} item={item} keeper={item.id === g.keeperId} label={t('keep')} />
          ))}
        </div>
        <div className="ml-auto">
          <MergeButton keeperId={g.keeperId} duplicateIds={dupIds} />
        </div>
      </li>
    );
  };

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <p className="text-body text-ink-soft mb-6">{t('countFound', { count: duplicateCount })}</p>

      <div className="space-y-8">
        {identical.length > 0 ? (
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-h3 text-ink">{t('identicalTitle')}</h2>
                <p className="text-small text-ink-soft">{t('identicalHint')}</p>
              </div>
              {identical.length > 1 ? (
                <MergeButton
                  keeperId={identical[0]!.keeperId}
                  duplicateIds={identical.flatMap((g) =>
                    g.items.map((i) => i.id).filter((id) => id !== g.keeperId),
                  )}
                  label={t('mergeAllIdentical')}
                />
              ) : null}
            </div>
            <ul className="space-y-3">{identical.map(mergeGroup)}</ul>
          </section>
        ) : null}

        {nearIdentical.length > 0 ? (
          <section>
            <h2 className="text-h3 text-ink mb-1">{t('nearTitle')}</h2>
            <p className="text-small text-ink-soft mb-3">{t('nearHint')}</p>
            <ul className="space-y-3">{nearIdentical.map(mergeGroup)}</ul>
          </section>
        ) : null}

        {series.length > 0 ? (
          <section>
            <h2 className="text-h3 text-ink mb-1">{t('seriesTitle')}</h2>
            <p className="text-small text-ink-soft mb-3">{t('seriesHint')}</p>
            <ul className="space-y-3">
              {series.map((g) => (
                <li
                  key={g.keeperId}
                  className="border-border rounded-card flex flex-wrap items-center gap-3 border p-3"
                >
                  <div className="flex flex-wrap gap-2">
                    {g.items.slice(0, 8).map((item) => (
                      <Thumb key={item.id} item={item} />
                    ))}
                  </div>
                  <span className="text-small text-ink-soft ml-auto">
                    {t('seriesCount', { count: g.items.length })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {pending.length > 0 ? (
          <section>
            <h2 className="text-h3 text-ink mb-1">{t('pendingTitle')}</h2>
            <p className="text-small text-ink-soft mb-3">{t('pendingHint')}</p>
            <ul className="flex flex-wrap gap-3">
              {pending.map((p) => (
                <li
                  key={p.item.id}
                  className="border-border rounded-card flex items-center gap-3 border p-2"
                >
                  <Thumb item={p.item} />
                  <form action={undoDedupAction}>
                    <input type="hidden" name="itemId" value={p.item.id} />
                    <button
                      type="submit"
                      className="text-small text-forest font-medium hover:underline"
                    >
                      {t('undo')}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
