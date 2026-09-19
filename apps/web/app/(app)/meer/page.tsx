import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, FileText, HeartHandshake, MapPin, Settings, Users } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card } from '@/components/ui/Card';

const MORE_ITEMS = [
  { key: 'documents', href: '/documenten', icon: FileText },
  { key: 'people', href: '/personen', icon: Users },
  { key: 'places', href: '/plaatsen', icon: MapPin },
  { key: 'family', href: '/familie', icon: HeartHandshake },
  { key: 'settings', href: '/instellingen', icon: Settings },
];

export default async function MorePage() {
  const t = await getTranslations('nav');
  return (
    <div>
      <PageHeader title={t('more')} />
      <Card>
        <ul className="divide-border divide-y">
          {MORE_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-body text-ink hover:bg-warm flex items-center gap-3 px-5 py-4"
              >
                <item.icon className="text-ink-soft h-5 w-5" aria-hidden="true" />
                <span className="flex-1">{t(item.key)}</span>
                <ChevronRight className="text-ink-soft h-5 w-5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
