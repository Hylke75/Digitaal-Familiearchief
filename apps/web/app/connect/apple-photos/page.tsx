import type { Metadata } from 'next';
import { Check, Smartphone } from 'lucide-react';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { Card, CardBody } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: "Apple Foto's veiligstellen",
  description: "Bewaar je Apple Foto's automatisch met de Bewora-app op je iPhone.",
};

/**
 * Universal-link target for Apple Foto's (docs/connectors/apple-photos.md §58,
 * §59). On an iPhone with the Bewora app installed, iOS opens the app to the
 * photo-connect flow (Associated Domains). Without the app, this page explains
 * how to get it. There is no browser API for Apple Photos — never fake one.
 */
export default function ConnectApplePhotosPage() {
  return (
    <div className="bg-warm min-h-dvh">
      <SiteHeader />
      <main className="max-w-content mx-auto px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="bg-forest mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white">
            <Smartphone className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="text-h1 text-ink mt-6">Apple Foto&apos;s veiligstellen</h1>
          <p className="text-body-lg text-ink-soft mt-4">
            Bewaar automatisch de foto&apos;s en video&apos;s op je iPhone en in iCloud Foto&apos;s.
            Dit werkt via de Bewora-app op je iPhone — je telefoon zelf geeft Bewora toegang tot je
            fotobibliotheek.
          </p>
          <p className="text-ink-soft text-small mt-3">
            Open deze pagina op je iPhone om de app te installeren en Apple Foto&apos;s te koppelen.
          </p>
        </div>

        <Card className="mx-auto mt-10 max-w-xl">
          <CardBody className="space-y-4 sm:p-8">
            <h2 className="text-h3 text-ink">Zo werkt het</h2>
            <ol className="space-y-3">
              {[
                'Installeer de Bewora-app op je iPhone.',
                "Open de app en tik op “Apple Foto's koppelen”.",
                'Geef volledige toegang tot je fotobibliotheek.',
                'Bewora stelt eerst je bestaande foto’s veilig en daarna automatisch nieuwe.',
              ].map((step) => (
                <li key={step} className="text-body text-ink flex items-start gap-3">
                  <Check className="text-brass mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                  {step}
                </li>
              ))}
            </ol>
            <p className="text-ink-soft border-border text-small border-t pt-4">
              De Bewora-app is in ontwikkeling. Je hoeft de app niet open te houden: iOS bepaalt
              wanneer nieuwe foto&apos;s op de achtergrond veiliggesteld kunnen worden.
            </p>
          </CardBody>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
