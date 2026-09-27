import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Folder } from 'lucide-react';
import { isDemo } from '@/lib/demo/mode';
import { documentSourceCards } from '@/lib/demo/documents';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { SubNav, DOCS_SUBNAV } from '@/components/demo/SubNav';

export default function DocumentSourcesPage() {
  if (!isDemo()) notFound();

  const cards = documentSourceCards();
  return (
    <div>
      <PageHeader title="Bronnen" subtitle="Waar je documenten vandaan komen." />
      <SubNav items={DOCS_SUBNAV} />
      <p className="text-small text-ink-soft mb-4">
        Zelfde documentenbibliotheek, gefilterd op bron.
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <li key={c.key}>
            <Link
              href={`/documenten?source=${encodeURIComponent(c.key)}`}
              className="block"
              aria-label={`${c.label}, ${c.count} documenten`}
            >
              <Card className="hover:border-brass transition-colors">
                <CardBody>
                  <span className="bg-warm text-brass rounded-card mb-3 inline-flex h-10 w-10 items-center justify-center">
                    <Folder className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="text-body text-ink font-semibold">{c.label}</p>
                  <p className="text-small text-ink-soft">{c.count} documenten</p>
                </CardBody>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
