import type { Metadata } from 'next';
import { BRAND } from '@dla/shared';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = { title: 'Privacyverklaring' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacyverklaring" updated="19 september 2026">
      <p className="text-body text-ink-soft">
        Deze verklaring legt uit hoe {BRAND.name} met je persoonsgegevens omgaat. We zijn ontworpen
        met privacy-by-design: je archief is van jou.
      </p>

      <LegalSection heading={`Wat is ${BRAND.name}?`}>
        <p>
          {BRAND.name} is een digitaal archief voor consumenten. Je koppelt de plekken waar je
          digitale leven al staat, wij stellen je bestaande geschiedenis veilig en bewaren nieuwe
          inhoud automatisch waar de dienst dat technisch toestaat. Je archief blijft onafhankelijk
          van de oorspronkelijke platforms.
        </p>
      </LegalSection>

      <LegalSection heading="Welke persoonsgegevens verwerken we?">
        <p>Afhankelijk van je gebruik verwerken we:</p>
        <ul className="list-disc pl-5">
          <li>account- en identiteitsgegevens (e-mailadres, naam, inloggegevens);</li>
          <li>
            gekoppelde-bron-gegevens (welke diensten, status, tijdstippen) — nooit onversleutelde
            tokens;
          </li>
          <li>
            de inhoud die je archiveert (foto’s, video’s, documenten, sociale media, metadata);
          </li>
          <li>operationele logboeken (zonder je persoonlijke inhoud, tokens of wachtwoorden).</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Waarom verwerken we deze gegevens?">
        <p>
          Uitsluitend om je archief veilig te stellen, te ordenen en beschikbaar te maken, en om de
          dienst te laten werken. We verwerken niet meer dan nodig (dataminimalisatie) en gebruiken
          je gegevens niet voor andere doeleinden.
        </p>
      </LegalSection>

      <LegalSection heading="Verbonden diensten en toestemmingen">
        <p>
          Als je een bron koppelt (zoals Google Drive, OneDrive, Dropbox of TikTok), vragen we via
          de officiële methode van die dienst toestemming voor uitsluitend de toegang die nodig is
          om je inhoud te archiveren. We vragen nooit om je wachtwoord bij de dienst, en we omzeilen
          geen toegangsbeperkingen.
        </p>
        <p>
          Voor diensten zonder geschikte automatische koppeling gebruik je een export (bijvoorbeeld
          Instagram, Facebook, Snapchat, X of Google Takeout) die je bij {BRAND.name} uploadt.
        </p>
      </LegalSection>

      <LegalSection heading="Waar worden je gegevens opgeslagen?">
        <p>
          Je gegevens worden in de Europese Unie verwerkt en opgeslagen (Supabase, regio Frankfurt).
          Originele bestanden staan in een privé-opslag die per gebruiker is afgeschermd; toegang
          verloopt via kortlevende, ondertekende links.
        </p>
      </LegalSection>

      <LegalSection heading="Provider-tokens en beveiliging">
        <p>
          OAuth-/toegangstokens worden versleuteld opgeslagen (AES-256-GCM), server-side en nooit in
          de browser of in logboeken. Je gegevens zijn afgeschermd met Row Level Security
          (standaard: geen toegang tenzij expliciet toegestaan).
        </p>
      </LegalSection>

      <LegalSection heading="Bewaartermijn">
        <p>
          We bewaren je archief zolang je account bestaat. Bron-metadata bewaren we zolang een bron
          gekoppeld is. Verwijder je je account, dan verwijderen we je gegevens volgens een
          gecontroleerde procedure.
        </p>
      </LegalSection>

      <LegalSection heading="Bron ontkoppelen">
        <p>
          Je kunt een bron altijd ontkoppelen.{' '}
          <strong>Ontkoppelen verwijdert niets wat al is veiliggesteld.</strong> Nieuwe inhoud wordt
          daarna niet meer automatisch gearchiveerd; je bestaande archief blijft van jou.
        </p>
      </LegalSection>

      <LegalSection heading="Bron verwijdert inhoud">
        <p>
          Verdwijnt een bestand of foto bij de bron, dan behouden we jouw gearchiveerde kopie en
          noteren we alleen dat de bron-kopie is verdwenen. Alleen jij kunt gearchiveerde inhoud
          definitief verwijderen — dat is een aparte, expliciete actie.
        </p>
      </LegalSection>

      <LegalSection heading="Account verwijderen en export">
        <p>
          Je kunt je account verwijderen; dit is een expliciete, beschermde handeling. Je kunt
          altijd een volledige kopie van je archief downloaden (originele bestanden + overdraagbare
          metadata) — er is geen vendor-lock-in.
        </p>
      </LegalSection>

      <LegalSection heading="AI en gebruik van je inhoud">
        <p>
          We gebruiken je persoonlijke inhoud <strong>niet</strong> om AI-modellen te trainen.
          Optionele AI-functies zijn apart bestuurbaar en sturen je inhoud niet naar derden zonder
          expliciete architectuur, toestemming en privacy-review.
        </p>
      </LegalSection>

      <LegalSection heading="Verwerkers">
        <p>
          We werken met zorgvuldig gekozen verwerkers: Supabase (database, authenticatie, opslag;
          EU) en Vercel (hosting). Per gekoppelde provider gelden aanvullende verwerkersafspraken.
        </p>
      </LegalSection>

      <LegalSection heading="Jouw AVG-rechten">
        <p>
          Je hebt recht op inzage, correctie, verwijdering, beperking, bezwaar en dataportabiliteit.
          Neem hiervoor contact op via{' '}
          <a
            className="text-forest font-semibold hover:underline"
            href={`mailto:${BRAND.supportEmail}`}
          >
            {BRAND.supportEmail}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Vragen over privacy? Mail{' '}
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
