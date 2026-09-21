import type { Metadata } from 'next';
import { Mail } from 'lucide-react';
import { BRAND } from '@dla/shared';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { Card, CardBody } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Neem contact op met Bewora.',
};

export default function ContactPage() {
  const { legalName, registration, country } = BRAND.company;
  return (
    <div className="bg-warm min-h-dvh">
      <SiteHeader />
      <main className="max-w-content mx-auto px-6 py-20">
        <div className="max-w-2xl">
          <h1 className="text-h1 text-ink">Contact</h1>
          <p className="text-body-lg text-ink-soft mt-4">
            Vragen over je archief, een koppeling of privacy? We helpen je graag.
          </p>

          <Card className="mt-8">
            <CardBody className="space-y-4 sm:p-8">
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="text-ink hover:text-forest inline-flex items-center gap-3 font-medium"
              >
                <span className="bg-warm text-forest inline-flex h-10 w-10 items-center justify-center rounded-[10px]">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </span>
                {BRAND.supportEmail}
              </a>
              {(legalName || registration || country) && (
                <p className="text-ink-soft border-border text-small border-t pt-4">
                  {[legalName, registration, country].filter(Boolean).join(' · ')}
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
