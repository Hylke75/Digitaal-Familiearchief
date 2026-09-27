import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Tag } from 'lucide-react';
import { isDemo } from '@/lib/demo/mode';
import { categoryCards } from '@/lib/demo/documents';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { SubNav, DOCS_SUBNAV } from '@/components/demo/SubNav';

export default function DocumentCategoriesPage() {
  if (!isDemo()) notFound();

  const cards = categoryCards();
  return (
    <div>
      <PageHeader title="Categorieën" subtitle="Documenten geordend op soort." />
      <SubNav items={DOCS_SUBNAV} />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <li key={c.name}>
            <Link
              href={`/documenten?category=${encodeURIComponent(c.name)}`}
              className="block"
              aria-label={`${c.name}, ${c.count} documenten`}
            >
              <Card className="hover:border-brass transition-colors">
                <CardBody>
                  <span className="bg-warm text-brass rounded-card mb-3 inline-flex h-10 w-10 items-center justify-center">
                    <Tag className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="text-body text-ink font-semibold">{c.name}</p>
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
