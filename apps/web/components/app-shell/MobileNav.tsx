'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MoreHorizontal } from 'lucide-react';
import { MOBILE_NAV } from '@/lib/navigation';
import { cn } from '@/lib/cn';

/** Bottom navigation on mobile (docs/DESIGN.md §7). */
export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const items = [...MOBILE_NAV, { key: 'more', href: '/meer', icon: MoreHorizontal }];

  return (
    <nav className="border-border bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur lg:hidden">
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'text-caption flex flex-col items-center gap-1 px-1 py-2',
                  active ? 'text-forest' : 'text-ink-soft',
                )}
              >
                <item.icon className="h-6 w-6" aria-hidden="true" />
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
