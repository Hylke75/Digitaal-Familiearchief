import { Logo } from '@/components/brand/Logo';
import { BRAND } from '@dla/shared';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Hoe het werkt', href: '#hoe' },
      { label: 'Wat je bewaart', href: '#bewaart' },
      { label: 'Bronnen', href: '#bronnen' },
      { label: 'Prijzen', href: '#prijzen' },
    ],
  },
  {
    title: 'Bedrijf',
    links: [
      { label: 'Over Bewora', href: '#over' },
      { label: 'Contact', href: BRAND.contactPath },
    ],
  },
  {
    title: 'Vertrouwen',
    links: [
      { label: 'Veiligheid', href: BRAND.securityPath },
      { label: 'Privacy', href: BRAND.privacyPath },
      { label: 'Voorwaarden', href: BRAND.termsPath },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Inloggen', href: '/inloggen' },
      { label: 'Start mijn archief', href: '/registreren' },
    ],
  },
];

/** Complete public footer (§32). Company details render only when configured. */
export function SiteFooter() {
  const { legalName, registration, country } = BRAND.company;
  return (
    <footer className="border-border bg-surface border-t">
      <div className="max-w-content mx-auto grid gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Logo size="md" />
          <p className="text-forest text-small mt-3 font-semibold">{BRAND.descriptorNl}</p>
          <p className="text-ink-soft text-small mt-1 max-w-xs">{BRAND.taglineNl}</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-ink text-small mb-3 font-semibold">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-ink-soft hover:text-ink text-small">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-border border-t">
        <div className="max-w-content text-ink-soft text-caption mx-auto flex flex-col gap-1 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {BRAND.name}
            {legalName ? ` · ${legalName}` : ''}
            {registration ? ` · ${registration}` : ''}
            {country ? ` · ${country}` : ''}
          </p>
          <p>{BRAND.supportEmail}</p>
        </div>
      </div>
    </footer>
  );
}
