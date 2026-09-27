'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export interface SubNavItem {
  label: string;
  href: string;
  /** Match exactly (not by prefix). Use for the "all" root of a section. */
  exact?: boolean;
}

/**
 * Secondary, horizontally-scrollable navigation for a section (§2, §54). On
 * desktop it reads as local tabs; on mobile it scrolls with one thumb.
 */
export function SubNav({ items }: { items: SubNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 mb-6 overflow-x-auto">
      <ul className="flex min-w-max gap-1 px-1">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'text-small inline-flex items-center rounded-full px-4 py-2 font-semibold transition-colors',
                  active
                    ? 'bg-forest text-white'
                    : 'border-border text-ink-soft hover:bg-warm hover:text-ink bg-surface border',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export const PHOTO_SUBNAV: SubNavItem[] = [
  { label: "Alle foto's", href: '/fotos', exact: true },
  { label: 'Tijdlijn', href: '/fotos/tijdlijn' },
  { label: 'Plaatsen', href: '/fotos/plaatsen' },
  { label: 'Albums', href: '/fotos/albums' },
  { label: 'Personen', href: '/fotos/personen' },
  { label: 'Bronnen', href: '/fotos/bronnen' },
];

export const DOCS_SUBNAV: SubNavItem[] = [
  { label: 'Alle documenten', href: '/documenten', exact: true },
  { label: 'Categorieën', href: '/documenten/categorieen' },
  { label: 'Mappen', href: '/documenten/mappen' },
  { label: 'Bronnen', href: '/documenten/bronnen' },
];
