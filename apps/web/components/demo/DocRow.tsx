import Link from 'next/link';
import { Download, FileText } from 'lucide-react';
import { formatBytes } from '@dla/shared';
import { DOC_SOURCE_LABELS } from '@/lib/demo/documents';
import { formatDemoDate } from '@/lib/demo/dates';
import { resolveDemoDocUrl } from '@/lib/demo/media';
import type { DemoDocument } from '@/lib/demo/types';

/** One document as a list row: icon + title + meta line + download (§31). */
export function DocRow({ doc }: { doc: DemoDocument }) {
  const meta = [
    doc.category,
    DOC_SOURCE_LABELS[doc.source] ?? doc.sourceLabel,
    formatDemoDate(doc.documentDate, 'DATE'),
    formatBytes(doc.fileSize),
  ].join(' · ');
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="bg-warm text-brass rounded-card flex h-10 w-10 shrink-0 items-center justify-center">
        <FileText className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={`/documenten/item/${doc.id}`}
          className="text-body text-ink hover:text-forest block truncate font-semibold"
        >
          {doc.title}
        </Link>
        <p className="text-small text-ink-soft truncate">{meta}</p>
      </div>
      <a
        href={resolveDemoDocUrl(doc.placeholder)}
        download
        aria-label={`Download ${doc.title}`}
        className="text-ink-soft hover:text-ink hover:bg-warm rounded-button inline-flex h-9 w-9 shrink-0 items-center justify-center"
      >
        <Download className="h-4.5 w-4.5" aria-hidden="true" />
      </a>
    </li>
  );
}
