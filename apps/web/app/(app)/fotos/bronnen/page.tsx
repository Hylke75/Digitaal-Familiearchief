import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { SubNav, PHOTO_SUBNAV } from '@/components/demo/SubNav';
import { Card, CardBody } from '@/components/ui/Card';
import { isDemo } from '@/lib/demo/mode';
import { photoSourceCards } from '@/lib/demo/queries';

export default function SourcesPage() {
  if (!isDemo()) notFound();

  const sources = photoSourceCards();

  return (
    <div>
      <PageHeader title="Bronnen" subtitle="Zelfde archief, andere invalshoek." />
      <SubNav items={PHOTO_SUBNAV} />

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((s) => (
          <li key={s.key}>
            <Link
              href={`/fotos/bronnen/${s.key}`}
              className="focus-visible:ring-forest rounded-card block focus-visible:outline-none focus-visible:ring-2"
            >
              <Card className="hover:bg-warm transition-colors">
                <CardBody>
                  <p className="text-body text-ink font-semibold">{s.label}</p>
                  <p className="text-small text-ink-soft mt-1">{s.count} foto&apos;s</p>
                </CardBody>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
