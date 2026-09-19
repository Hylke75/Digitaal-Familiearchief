import type { Metadata } from 'next';
import { BRAND } from '@dla/shared';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = { title: 'Gebruiksvoorwaarden' };

export default function TermsPage() {
  return (
    <LegalPage title="Gebruiksvoorwaarden" updated="19 september 2026">
      <p className="text-body text-ink-soft">
        Deze voorwaarden gelden voor je gebruik van {BRAND.name}. Door {BRAND.name} te gebruiken ga
        je hiermee akkoord.
      </p>

      <LegalSection heading="De dienst">
        <p>
          {BRAND.name} helpt je een onafhankelijk archief te maken van je eigen digitale inhoud. We
          stellen inhoud veilig waar de betrokken diensten dat technisch en volgens hun voorwaarden
          toestaan. Sommige bronnen werken automatisch, andere via een handmatige export — dit wordt
          in de app eerlijk aangegeven.
        </p>
      </LegalSection>

      <LegalSection heading="Jouw account">
        <p>
          Je bent verantwoordelijk voor je account en de juistheid van je gegevens. Gebruik{' '}
          {BRAND.name} alleen voor inhoud waarvoor je de rechten hebt.
        </p>
      </LegalSection>

      <LegalSection heading="Toegestaan gebruik">
        <p>
          Je gebruikt {BRAND.name} niet voor onrechtmatige inhoud of om rechten van anderen te
          schenden. We archiveren uitsluitend via officiële methodes van providers; we omzeilen geen
          toegangsbeperkingen.
        </p>
      </LegalSection>

      <LegalSection heading="Je inhoud blijft van jou">
        <p>
          Je behoudt alle rechten op je inhoud. Je kunt je volledige archief exporteren en je
          account verwijderen. Ontkoppelen van een bron verwijdert je bestaande archief niet.
        </p>
      </LegalSection>

      <LegalSection heading="Beschikbaarheid">
        <p>
          We doen ons best om de dienst betrouwbaar te houden, maar kunnen geen ononderbroken
          beschikbaarheid garanderen. Onbereikbaarheid van een externe bron betekent nooit dat je
          archief wordt verwijderd.
        </p>
      </LegalSection>

      <LegalSection heading="Aansprakelijkheid">
        <p>
          {BRAND.name} wordt geleverd &ldquo;zoals het is&rdquo; voor zover wettelijk toegestaan. We
          claimen geen absolute garanties zoals &ldquo;onhackbaar&rdquo; of &ldquo;100%
          veilig&rdquo;.
        </p>
      </LegalSection>

      <LegalSection heading="Wijzigingen">
        <p>
          We kunnen deze voorwaarden bijwerken. Bij wezenlijke wijzigingen informeren we je via de
          app of per e-mail.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Vragen? Mail{' '}
          <a
            className="text-forest font-semibold hover:underline"
            href={`mailto:${BRAND.supportEmail}`}
          >
            {BRAND.supportEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
