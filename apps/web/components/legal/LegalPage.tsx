import Link from 'next/link';
import { BRAND } from '@dla/shared';

/** Shared shell for public legal pages — calm, readable, on-brand. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-warm min-h-dvh">
      <header className="max-w-content mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" className="text-h3 text-forest font-semibold">
          {BRAND.name}
        </Link>
        <nav className="text-small text-ink-soft flex gap-4">
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Voorwaarden
          </Link>
          <Link href="/security" className="hover:text-ink">
            Beveiliging
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-h1 text-ink">{title}</h1>
        <p className="text-small text-ink-soft mt-2">Laatst bijgewerkt: {updated}</p>
        <article className="legal text-body text-ink mt-8 space-y-6">{children}</article>
        <footer className="border-border text-small text-ink-soft mt-16 border-t pt-6">
          {BRAND.name} — {BRAND.taglineNl}
        </footer>
      </main>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-h3 text-ink">{heading}</h2>
      <div className="text-body text-ink-soft space-y-2">{children}</div>
    </section>
  );
}
