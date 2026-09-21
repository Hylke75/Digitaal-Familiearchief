/**
 * Centralised Dutch marketing copy for the public site (docs BRAND_UPDATE §59).
 * Pages reference this instead of duplicating sentences. Keep it truthful — do
 * not describe features that are not implemented. An `en` variant lives beside
 * this file when internationalisation is needed.
 */
export const marketingNl = {
  nav: {
    how: 'Hoe het werkt',
    preserve: 'Wat je bewaart',
    security: 'Veiligheid',
    family: 'Voor families',
    pricing: 'Prijzen',
    faq: 'FAQ',
    login: 'Inloggen',
    cta: 'Start mijn archief',
    ctaSecondary: 'Bekijk hoe het werkt',
  },

  hero: {
    headline: ['Instagram bewaart Instagram.', 'Google bewaart Google.', 'Bewora bewaart jou.'],
    body: "Koppel je foto's, sociale media en documenten één keer. Bewora verzamelt ze automatisch in een onafhankelijk digitaal archief dat van jou blijft.",
    note: 'Je hoeft geen bestanden handmatig te verplaatsen.',
  },

  platforms: {
    heading: 'Bewora brengt je digitale leven samen uit de diensten die je al gebruikt.',
    // Capability is shown accurately per source (see connect registry).
  },

  productProof: {
    heading: 'Dit is Bewora.',
    body: 'Geen map vol losse bestanden, maar een archief waarin je je digitale leven kunt terugvinden.',
  },

  how: {
    heading: 'Zo werkt Bewora',
    steps: [
      {
        title: 'Koppel',
        body: 'Kies de diensten die je gebruikt en geef toestemming.',
      },
      {
        title: 'Bewora bewaart',
        body: 'We stellen je bestaande archief veilig en bewaren daarna nieuwe content automatisch waar de gekoppelde dienst dat ondersteunt.',
      },
      {
        title: 'Jij houdt het',
        body: 'Je archief blijft onafhankelijk beschikbaar en is altijd exporteerbaar.',
      },
    ],
    note: 'Een bron koppelen duurt meestal minder dan een minuut.',
  },

  preserve: {
    heading: 'Wat Bewora bewaart',
    groups: [
      {
        title: "Foto's en video's",
        body: 'Van je telefoon, fotodiensten en sociale platforms.',
      },
      {
        title: 'Sociale media',
        body: "Posts, foto's, video's en bijbehorende gegevens waar beschikbaar.",
      },
      {
        title: 'Documenten',
        body: 'Van Google Drive, OneDrive, Dropbox en je eigen uploads.',
      },
    ],
  },

  timeline: {
    heading: 'Meer dan opslag. Een archief dat je terugvindt.',
    body: 'Bewora ordent wat je bewaart op tijd en plaats, zodat je je eigen geschiedenis kunt teruglezen.',
  },

  ownership: {
    heading: 'Jouw archief. Echt van jou.',
    body: 'Bewora is gemaakt om je digitale leven onafhankelijk te bewaren. Daarom moet je ook zonder Bewora bij je bestanden kunnen.',
    points: [
      'Je originele bestanden zijn te downloaden.',
      'Standaard bestandsformaten — geen eigen, afgesloten formaat.',
      'Een bron loskoppelen verwijdert je gearchiveerde kopieën niet.',
      'Je kunt je archief zelf verwijderen.',
    ],
    stops: {
      heading: 'Wat als Bewora ooit stopt?',
      body: 'Daarom bouwen we Bewora zo dat je altijd een volledige export van je eigen archief kunt maken. Je bestanden mogen nooit afhankelijk zijn van één leverancier — ook niet van ons.',
    },
  },

  family: {
    heading: ['Het fotoalbum van vroeger.', 'Maar dan voor je hele digitale leven.'],
    body: 'Vroeger gingen fotoalbums van de ene generatie naar de andere. Vandaag staat je familiegeschiedenis verspreid over telefoons, clouds en sociale platforms. Bewora brengt het samen.',
    secondary:
      'Niet 80.000 losse bestanden voor later, maar een archief waarin je familie kan begrijpen wat ze ziet.',
    passOn: {
      heading: 'Wat jij verzamelt, kan later verder.',
      body: 'Familieherinneringen, belangrijke documenten en verhalen — bewaard op één plek die je later kunt doorgeven.',
    },
  },

  independence: {
    heading: 'Wat er met een platform gebeurt, jouw archief blijft van jou.',
    results: [
      { event: 'Instagram-foto verwijderd', result: 'Bewora-kopie blijft bewaard' },
      { event: 'Je stopt met een sociaal netwerk', result: 'Je archief blijft' },
      { event: 'Je wisselt van telefoon', result: 'Je archief blijft' },
      { event: 'Een dienst verandert zijn product', result: 'Wat al bewaard is, blijft' },
    ],
  },

  trust: {
    heading: 'Waarom je Bewora kunt vertrouwen',
    body: 'Bewora is nieuw. Daarom laten we liever het product en de feiten spreken dan grote beloftes.',
  },

  pricing: {
    heading: 'Prijzen',
    undecidedBody: 'We ronden het prijsmodel af. Je kunt nu al starten en je eerste bron koppelen.',
  },

  faq: {
    heading: 'Veelgestelde vragen',
    items: [
      {
        q: 'Wat is Bewora?',
        a: 'Bewora is een onafhankelijk, automatisch archief van je digitale leven. Je koppelt de diensten die je al gebruikt; Bewora stelt veilig wat er al staat en bewaart nieuwe content waar dat kan.',
      },
      {
        q: 'Hoe werkt Bewora?',
        a: 'Je koppelt een bron en geeft toestemming. Bewora importeert je bestaande archief en houdt daarna nieuwe content bij waar de dienst dat ondersteunt.',
      },
      {
        q: 'Verplaatst Bewora mijn bestanden?',
        a: 'Nee. Bewora maakt een onafhankelijke, gearchiveerde kopie. Je originele bestanden bij de bron worden niet gewijzigd of verwijderd.',
      },
      {
        q: 'Wat gebeurt er als ik iets bij de bron verwijder?',
        a: 'Bewora legt vast dat het bij de bron is verdwenen, maar je gearchiveerde kopie blijft bewaard. Bronverwijdering en archiefverwijdering zijn los van elkaar.',
      },
      {
        q: 'Kan ik alles weer downloaden?',
        a: 'Je originele bestanden zijn te downloaden. We bouwen daarnaast een volledige export van je hele archief in standaard formaten.',
      },
      {
        q: 'Welke diensten kan ik koppelen?',
        a: 'Per bron laten we eerlijk zien of die automatisch koppelt, foto’s laat kiezen, via een archiefimport werkt of binnenkort beschikbaar is.',
      },
      {
        q: 'Blijft Bewora automatisch bijwerken?',
        a: 'Dat hangt af van de bron en je eigen instelling. Waar een dienst het ondersteunt, houdt Bewora nieuwe content automatisch bij.',
      },
      {
        q: 'Kan ik een koppeling verbreken?',
        a: 'Ja. Een koppeling verbreken verwijdert je gearchiveerde bestanden niet — die blijven, tenzij je ze zelf verwijdert.',
      },
      {
        q: 'Wat als Bewora stopt?',
        a: 'Daarom bouwen we Bewora zo dat je altijd een volledige export van je eigen archief kunt maken. Je bestanden mogen nooit afhankelijk zijn van één leverancier — ook niet van ons.',
      },
      {
        q: 'Waar worden mijn gegevens opgeslagen?',
        a: 'In de Europese Unie (Supabase, regio eu-central-1).',
      },
      {
        q: 'Kan Bewora mijn foto’s en documenten bekijken?',
        a: 'Beheerders hebben geen automatische toegang tot je persoonlijke inhoud. Toegang voor ondersteuning is uitzonderlijk, met reden en vastgelegd. We claimen geen zero-knowledge of end-to-end-versleuteling.',
      },
      {
        q: 'Worden mijn gegevens gebruikt om AI te trainen?',
        a: 'Nee, niet zonder expliciete grondslag of toestemming. Zie ons privacybeleid.',
      },
    ],
  },

  finalCta: {
    heading: 'Begin met bewaren wat van jou is.',
    body: 'Koppel je eerste bron en Bewora stelt veilig wat er al staat.',
  },
} as const;

export type MarketingNl = typeof marketingNl;
