import { getFormatter, getTranslations } from 'next-intl/server';
import { Download, FileText } from 'lucide-react';
import type { Enums } from '@dla/database';
import { formatBytes } from '@dla/shared';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';

/**
 * Archive browser listing for one item type (docs/DESIGN.md §31). Real archived
 * items are read under RLS; originals download via a short-lived signed URL.
 * Synthetic mock content is not a real image, so items are shown as file cards
 * rather than thumbnails.
 */
export async function ArchiveList({
  type,
  title,
  emptyTitle,
  emptyBody,
}: {
  type: Enums<'archive_item_type'>;
  title: string;
  emptyTitle: string;
  emptyBody: string;
}) {
  const f = await getFormatter();
  const tSources = await getTranslations('sources');

  const supabase = createClient();
  const { data: items } = await supabase
    .from('archive_items')
    .select('id, original_filename, file_size, created_at_source, archived_at')
    .eq('type', type)
    .order('created_at_source', { ascending: false, nullsFirst: false })
    .limit(120);

  const count = items?.length ?? 0;

  return (
    <div>
      <PageHeader title={title} subtitle={count > 0 ? f.number(count) : undefined} />

      {count === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" aria-hidden="true" />}
          title={emptyTitle}
          description={emptyBody}
          action={<ButtonLink href="/bronnen">{tSources('connect')}</ButtonLink>}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items!.map((item) => (
            <li key={item.id}>
              <Card>
                <CardBody className="flex items-center gap-3 py-4">
                  <span className="bg-warm text-forest inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-ink truncate font-semibold">{item.original_filename}</p>
                    <p className="text-small text-ink-soft">
                      {item.created_at_source
                        ? f.dateTime(new Date(item.created_at_source), { dateStyle: 'medium' })
                        : ''}{' '}
                      · {formatBytes(item.file_size)}
                    </p>
                  </div>
                  <a
                    href={`/archief/download/${item.id}`}
                    className="rounded-button text-ink-soft hover:bg-warm hover:text-ink p-2 transition-colors"
                    aria-label="Download origineel"
                    title="Download origineel"
                  >
                    <Download className="h-5 w-5" aria-hidden="true" />
                  </a>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
