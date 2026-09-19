import type { Metadata } from 'next';
import { BRAND } from '@dla/shared';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = { title: 'Beveiliging' };

export default function SecurityPage() {
  return (
    <LegalPage title="Beveiliging" updated="19 september 2026">
      <p className="text-body text-ink-soft">
        Beveiliging staat bij {BRAND.name} voorop — vanaf het begin, niet als bijzaak.
      </p>

      <LegalSection heading="Toegang en isolatie">
        <p>
          Alle gegevens zijn per gebruiker afgeschermd met Row Level Security (standaard: geen
          toegang tenzij expliciet toegestaan). Beheerders hebben geen automatische toegang tot je
          persoonlijke inhoud.
        </p>
      </LegalSection>

      <LegalSection heading="Versleuteling">
        <p>
          Verkeer verloopt via TLS. Provider-tokens worden versleuteld opgeslagen (AES-256-GCM),
          server-side en nooit in de browser of in logboeken. Originele bestanden staan in
          privé-opslag; toegang verloopt via kortlevende, ondertekende links.
        </p>
      </LegalSection>

      <LegalSection heading="Veilige uploads">
        <p>
          Geüploade archieven worden veilig verwerkt: bescherming tegen path-traversal en zip-bombs,
          groottelimieten en validatie. Inhoud wordt nooit uitgevoerd.
        </p>
      </LegalSection>

      <LegalSection heading="EU-verwerking">
        <p>Je gegevens worden in de Europese Unie verwerkt en opgeslagen.</p>
      </LegalSection>

      <LegalSection heading="Verantwoord melden">
        <p>
          Denk je een kwetsbaarheid te hebben gevonden? Mail{' '}
          <a
            className="text-forest font-semibold hover:underline"
            href={`mailto:${BRAND.supportEmail}`}
          >
            {BRAND.supportEmail}
          </a>
          . We reageren zo snel mogelijk.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
