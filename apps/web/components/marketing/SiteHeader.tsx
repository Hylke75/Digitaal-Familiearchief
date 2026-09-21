import { Menu } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ButtonLink } from '@/components/ui/Button';
import { marketingNl as m } from '@/content/marketing.nl';

const NAV = [
  { label: m.nav.how, href: '#hoe' },
  { label: m.nav.preserve, href: '#bewaart' },
  { label: m.nav.security, href: '/security' },
  { label: m.nav.family, href: '#families' },
  { label: m.nav.pricing, href: '#prijzen' },
  { label: m.nav.faq, href: '#faq' },
];

/** Public site header (§14). CSS-only mobile menu via <details> — no client JS. */
export function SiteHeader() {
  return (
    <header className="border-border/70 bg-warm/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="max-w-content mx-auto flex items-center justify-between gap-4 px-6 py-4">
        <Logo href="/" size="md" />

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="text-ink-soft hover:text-ink text-small">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink href="/inloggen" variant="ghost" size="sm">
            {m.nav.login}
          </ButtonLink>
          <ButtonLink href="/registreren" size="sm">
            {m.nav.cta}
          </ButtonLink>
        </div>

        {/* Mobile */}
        <details className="group relative lg:hidden">
          <summary className="text-ink rounded-button flex cursor-pointer list-none items-center p-2 [&::-webkit-details-marker]:hidden">
            <Menu className="h-6 w-6" aria-hidden="true" />
            <span className="sr-only">Menu</span>
          </summary>
          <div className="rounded-card border-border bg-surface shadow-modal absolute right-0 mt-2 w-56 border p-2">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-ink hover:bg-warm text-small block rounded-md px-3 py-2"
              >
                {item.label}
              </a>
            ))}
            <div className="border-border mt-2 space-y-2 border-t pt-2">
              <ButtonLink
                href="/inloggen"
                variant="secondary"
                size="sm"
                className="w-full justify-center"
              >
                {m.nav.login}
              </ButtonLink>
              <ButtonLink href="/registreren" size="sm" className="w-full justify-center">
                {m.nav.cta}
              </ButtonLink>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
