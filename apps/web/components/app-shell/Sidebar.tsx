'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { NAV_GROUPS } from '@/lib/navigation';
import { CheckCircle2, LogOut, Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from '@/components/brand/Logo';
import { signOutAction } from '@/lib/auth/actions';
import { cn } from '@/lib/cn';

/** Fixed desktop sidebar (docs/DESIGN.md §6). */
export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tHealth = useTranslations('health');
  const tAuth = useTranslations('auth');

  return (
    <aside className="border-border bg-surface hidden w-64 shrink-0 flex-col border-r lg:flex">
      <div className="px-5 py-6">
        <Logo href="/vandaag" size="md" />
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group, i) => (
          <ul
            key={i}
            className="border-border space-y-0.5 border-t pt-4 first:border-t-0 first:pt-0"
          >
            {group.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'rounded-button text-body flex items-center gap-3 px-3 py-2 transition-colors',
                      active
                        ? 'bg-soft-green text-forest font-semibold'
                        : 'text-ink-soft hover:bg-warm hover:text-ink',
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </nav>

      <div className="border-border flex items-center gap-3 border-t px-4 py-4">
        <Avatar name={userName} />
        <div className="min-w-0 flex-1">
          <p className="text-small text-ink truncate font-semibold">{userName}</p>
          <p className="text-caption text-success mt-0.5 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {tHealth('safe')}
          </p>
        </div>
        <Link
          href="/instellingen"
          aria-label={t('settings')}
          title={t('settings')}
          className="rounded-button text-ink-soft hover:bg-warm hover:text-ink p-2 transition-colors"
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label={tAuth('signOut')}
            title={tAuth('signOut')}
            className="rounded-button text-ink-soft hover:bg-warm hover:text-ink p-2 transition-colors"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>
      </div>
    </aside>
  );
}
