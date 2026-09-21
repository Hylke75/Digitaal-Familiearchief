import { getFormatter, getTranslations } from 'next-intl/server';
import { Download, FileText } from 'lucide-react';
import type { Enums } from '@dla/database';
import { formatBytes } from '@dla/shared';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'archief';

// Browser-renderable image types get a real thumbnail; others (HEIC, video,
// documents) fall back to a file card. Supabase image transforms keep the
// preview small so we never pull full-resolution originals into the grid (§31).
const RENDERABLE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

/**
 * Archive browser listing for one item type (docs/DESIGN.md §31). Real archived
 * items are read under RLS; image items show a lightweight thumbnail via a
 * short-lived signed+transformed URL, and originals download via a signed URL.
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
    .select(
      'id, original_filename, file_size, mime_type, storage_key, created_at_source, archived_at',
    )
    .eq('type', type)
    .order('created_at_source', { ascending: false, nullsFirst: false })
    .limit(120);

  const count = items?.length ?? 0;

  // Generate thumbnail URLs for renderable images in parallel (small transform).
  const thumbs = new Map<string, string>();
  await Promise.all(
    (items ?? [])
      .filter((it) => it.mime_type && RENDERABLE.has(it.mime_type))
      .map(async (it) => {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(it.storage_key, 3600, {
          transform: { width: 600, height: 600, resize: 'cover', quality: 60 },
        });
        if (data?.signedUrl) thumbs.set(it.id, data.signedUrl);
      }),
  );

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
          {items!.map((item) => {
            const thumb = thumbs.get(item.id);
            const meta = `${
              item.created_at_source
                ? f.dateTime(new Date(item.created_at_source), { dateStyle: 'medium' }) + ' · '
                : ''
            }${formatBytes(item.file_size)}`;

            if (thumb) {
              return (
                <li key={item.id}>
                  <Card className="group overflow-hidden">
                    <div className="bg-warm relative aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumb}
                        alt={item.original_filename}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <a
                        href={`/archief/download/${item.id}`}
                        className="text-ink absolute right-2 top-2 rounded-full bg-white/85 p-2 shadow-sm backdrop-blur transition-opacity hover:bg-white"
                        aria-label={`Download ${item.original_filename}`}
                        title="Download origineel"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </div>
                    <CardBody className="py-2">
                      <p className="text-ink text-small truncate font-medium">
                        {item.original_filename}
                      </p>
                      <p className="text-small text-ink-soft">{meta}</p>
                    </CardBody>
                  </Card>
                </li>
              );
            }

            return (
              <li key={item.id}>
                <Card>
                  <CardBody className="flex items-center gap-3 py-4">
                    <span className="bg-warm text-forest inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]">
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-ink truncate font-semibold">{item.original_filename}</p>
                      <p className="text-small text-ink-soft">{meta}</p>
                    </div>
                    <a
                      href={`/archief/download/${item.id}`}
                      className="rounded-button text-ink-soft hover:bg-warm hover:text-ink p-2 transition-colors"
                      aria-label={`Download ${item.original_filename}`}
                      title="Download origineel"
                    >
                      <Download className="h-5 w-5" aria-hidden="true" />
                    </a>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
