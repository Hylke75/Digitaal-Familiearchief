import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/cn';
import { isDemo } from '@/lib/demo/mode';
import { folderTreeForSource, foldersSourceList, type FolderNode } from '@/lib/demo/documents';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SubNav, DOCS_SUBNAV } from '@/components/demo/SubNav';

type SearchParams = Record<string, string | string[] | undefined>;

function renderNode(node: FolderNode, depth: number, source: string): React.ReactNode {
  const Icon = depth === 0 ? FolderOpen : Folder;
  return (
    <div key={node.path}>
      <Link
        href={`/documenten?source=${encodeURIComponent(source)}&folder=${encodeURIComponent(node.path)}`}
        className="hover:bg-warm rounded-button flex items-center gap-2 py-2 pr-2 transition-colors"
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
      >
        <Icon className="text-brass h-4.5 w-4.5 shrink-0" aria-hidden="true" />
        <span className="text-body text-ink font-medium">{node.name}</span>
        <span className="text-small text-ink-soft">{node.count}</span>
      </Link>
      {node.children.map((child) => renderNode(child, depth + 1, source))}
    </div>
  );
}

export default function DocumentFoldersPage({ searchParams }: { searchParams: SearchParams }) {
  if (!isDemo()) notFound();

  const sources = foldersSourceList();
  const requested = Array.isArray(searchParams.source)
    ? searchParams.source[0]
    : searchParams.source;
  const source =
    requested && sources.some((s) => s.key === requested) ? requested : sources[0]?.key;
  const tree = source ? folderTreeForSource(source) : null;

  return (
    <div>
      <PageHeader title="Mappen" subtitle="De oorspronkelijke mappenstructuur per bron." />
      <SubNav items={DOCS_SUBNAV} />

      <nav className="-mx-1 mb-6 overflow-x-auto">
        <ul className="flex min-w-max gap-1 px-1">
          {sources.map((s) => {
            const active = s.key === source;
            return (
              <li key={s.key}>
                <Link
                  href={`/documenten/mappen?source=${encodeURIComponent(s.key)}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'text-small inline-flex items-center rounded-full px-4 py-2 font-semibold transition-colors',
                    active
                      ? 'bg-forest text-white'
                      : 'border-border text-ink-soft hover:bg-warm hover:text-ink bg-surface border',
                  )}
                >
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {tree ? (
        <Card>
          <CardBody className="py-2">{renderNode(tree, 0, source!)}</CardBody>
        </Card>
      ) : (
        <EmptyState
          icon={<Folder className="h-8 w-8" aria-hidden="true" />}
          title="Geen mappen"
          description="Deze bron heeft geen mappenstructuur."
        />
      )}
    </div>
  );
}
