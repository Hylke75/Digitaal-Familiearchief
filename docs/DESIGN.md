# Complete Design Specification — Digitaal Familiearchief

_Status: Authoritative UX/UI specification. Read together with `CLAUDE.md`
(product + technical spec). Where a pattern is defined here, do not invent a new
one. Build a reusable design system first, then implement screens from it._

Last updated: 2026-09-18.

---

## 1. Designconcept

De essentie van de interface is:

> **Mijn digitale leven is veilig.**

Niet:

> Mijn bestanden staan in cloudopslag.

De uitstraling moet ergens tussen **Apple Photos, 1Password en een luxe digitaal
familiealbum** zitten: heel eenvoudig, veel rust, mooie fotografie, minimale
techniek en veel vertrouwen.

De gebruiker moet binnen enkele seconden begrijpen:

- **Wat is veiliggesteld?**
- **Waar komt het vandaan?**
- **Moet ik iets doen?**
- **Kan ik het terugvinden?**

De interface draait daarom niet om mappen, gigabytes en synchronisatielogs, maar
om **herinneringen, bronnen, tijd en mensen**.

---

## 2. Positionering in de interface

Gebruik in consumentencommunicatie zo min mogelijk het woord _backup_.

Primair taalgebruik: **Veiligstellen · Bewaren · Herinneringen · Mijn leven ·
Bronnen · Familie · Archief**.

Technische woorden zoals sync, API, OAuth en tokens bestaan niet in de
consumenteninterface.

Belangrijkste merkbelofte bovenaan:

> **Alles wat je niet kwijt wilt. Op één veilige plek.**

Subregel:

> Verbind je foto's, video's, sociale media en belangrijke documenten één keer.
> Daarna zorgen wij ervoor dat je digitale leven bewaard blijft.

---

## 3. Visuele identiteit

Werknaam in code: `DigitalArchive`. Merknaam wordt later gekozen.

### Kleuren (warm, niet klinisch)

| Token | Hex | Gebruik |
|---|---|---|
| Primary — Deep Forest | `#18392F` | logo, primaire knoppen, belangrijke navigatie |
| Primary Hover | `#102B24` | hover van primair |
| Warm background | `#F7F6F2` | algemene achtergrond (geen hard wit) |
| Surface | `#FFFFFF` | kaarten, modals, panelen |
| Text primary | `#17201D` | primaire tekst |
| Text secondary | `#66706C` | secundaire tekst |
| Border | `#E5E7E3` | randen |
| Success | `#237A57` | succes |
| Warning | `#C67A19` | waarschuwing |
| Danger | `#B64343` | fout / gevaar |
| Soft green | `#E8F2ED` | zachte succes-vlakken |
| Soft amber | `#FFF3DC` | zachte waarschuwings-vlakken |
| Soft red | `#FAEAEA` | zachte fout-vlakken |

Foto's en video's vormen zelf de belangrijkste kleur. De interface eromheen
blijft rustig.

---

## 4. Typografie

Bij voorkeur **Inter** of een vergelijkbaar zeer leesbaar sans-serif font.

Desktop schaal: H1 40–48px · H2 30–34px · H3 22–24px · Body large 18px · Body
16px · Small 14px · Caption 12–13px.

Gewicht: Headings 600 · Buttons 600 · Body 400 · Subtitles 400. Geen overdreven
dikke fonts.

---

## 5. Vormtaal

Border radius: Cards `16px` · Buttons `10px` · Inputvelden `10px` · Modals `20px`.

Schaduwen heel subtiel. Geen grote gradients. Geen glas-effecten. Geen donkere
cybersecurity-interface. Het product moet menselijk voelen.

---

## 6. Desktopstructuur

Vaste linkerzijbalk:

```text
LOGO

Vandaag
Mijn leven
Foto's
Video's
Documenten
Social
─────────────
Personen
Plaatsen
─────────────
Bronnen
Familie
─────────────
Instellingen
```

Onderaan de zijbalk:

```text
[avatar]
Hylke
Alles veilig ✓
```

Bovenkant van iedere pagina: paginatitel · eventuele subtitel · contextuele actie
rechts. Bijvoorbeeld:

```text
Mijn leven                         + Herinnering toevoegen
Alles wat je door de jaren heen hebt bewaard
```

---

## 7. Mobiele navigatie

Geen zijbalk. Bottom navigation: **Vandaag · Archief · Mijn leven · Bronnen ·
Meer**.

Via **Meer**: Documenten, Personen, Plaatsen, Familie, Instellingen. De
belangrijkste handelingen moeten met één duim bereikbaar zijn.

---

## 8. Inloggen

Extreem eenvoudig, geen marketing rechts. Dit is een vertrouwelijke omgeving.

```text
                 [logo]
       Welkom terug
       Log in om bij je digitale archief te komen.

       [ Doorgaan met Apple ]
       [ Doorgaan met Google ]
       ─────── of ───────
       E-mailadres
       [________________]
       [ Doorgaan ]

       Nog geen account?  Account aanmaken
```

---

## 9. Registratie

Vraag alleen wat echt nodig is; niet direct twintig instellingen.

```text
Maak je archief
Voornaam
Achternaam
E-mailadres
[ Account aanmaken ]
```

Daarna eventuele login verification.

---

## 10. Onboarding — scherm 1 (cruciaal)

```text
Welkom, Hylke

Laten we veiligstellen wat je niet kwijt wilt.

Koppel de plekken waar je foto's, video's en
belangrijke bestanden staan. Wij zorgen daarna
voor de rest.

[ Start ]
```

Daaronder eventueel: **Duurt ongeveer 5 minuten**.

---

## 11. Onboarding — wat wil je bewaren?

Eerst betekenis, geen technische bronselectie.

```text
Wat wil je veiligstellen?
☑ Mijn foto's en video's
☑ Mijn sociale media
☑ Mijn belangrijke documenten
Je kunt dit later altijd aanpassen.
[ Verder ]
```

---

## 12. Onboarding — bronnen verbinden

Nu pas de platformen, ieder met eigen herkenbaar logo. Niet de technische
toestand tonen.

**Foto's en video's**: Apple Foto's `[ Koppelen ]`, Google Photos `[ Koppelen ]`.

**Sociale media**: Instagram `[ Koppelen ]`, Facebook `[ Koppelen ]`, TikTok
`[ Koppelen ]`, Snapchat `[ Importeren ]`, X `[ Importeren ]`.

**Documenten**: Google Drive `[ Koppelen ]`, OneDrive `[ Koppelen ]`, Dropbox
`[ Koppelen ]`.

> Welke actie een bron toont (Koppelen / Importeren / Binnenkort / Opnieuw
> verbinden) volgt uit de connector capability registry (CLAUDE.md §15). Nooit een
> nep-Koppelen tonen voor een niet-beschikbare bron.

---

## 13. Koppel-flow

Tik op bijvoorbeeld Google Drive → modal:

```text
Google Drive veiligstellen

We maken een onafhankelijke kopie van de
bestanden waarvoor je toestemming geeft.

Je bestanden in Google Drive worden niet
gewijzigd of verwijderd.

[ Google Drive koppelen ]
Annuleren
```

Daarna officiële Google-login. Na terugkomst:

```text
✓ Google Drive is gekoppeld
We kijken nu welke bestanden we voor je
kunnen veiligstellen.
[ Verder ]
```

---

## 14. Discovery-scherm (emotioneel effect)

```text
We hebben je Google Drive bekeken
2.842 bestanden gevonden

1.948 documenten
486 foto's
213 video's
195 andere bestanden

We gaan ze nu veiligstellen.
[ Start ]
```

Later gebeurt deze stap desgewenst automatisch zonder extra knop.

---

## 15. Eerste grote import

Geen technische progress-console.

```text
Je archief wordt opgebouwd
████████████░░░░░░ 64%
1.801 van 2.842 bestanden veiliggesteld

Je hoeft hier niet te wachten. Dit gaat vanzelf verder.
[ Naar mijn archief ]
```

Daaronder: _Je krijgt bericht zodra alles is veiliggesteld._

---

## 16. Dashboard — Vandaag (belangrijkste scherm)

```text
Goedemorgen Hylke
✓ Je digitale leven is veilig
```

Groot daaronder:

```text
68.482
herinneringen veiliggesteld
```

Visualiseer: `42.183 foto's · 4.382 video's · 1.384 documenten · 20.533 andere
herinneringen`. Niet te veel grafieken.

---

## 17. Dashboard — recente herinneringen

Grote fotografische tegel:

```text
Vandaag, 6 jaar geleden
Madeira
18 september 2020
[ foto collage ]
```

Hier ontstaat emotionele waarde; het dashboard is niet alleen een
security-dashboard maar ook een plek waar mensen graag terugkomen.

---

## 18. Dashboard — bronnen

```text
Jouw bronnen
Apple Foto's   ✓ Vandaag bijgewerkt   42.183 items
Instagram      ✓ Vandaag bijgewerkt   1.826 items
Google Drive   ✓ Gisteren bijgewerkt  2.842 items
TikTok         ✓ Vandaag bijgewerkt   428 items
```

Onderaan: **+ Bron toevoegen**.

---

## 19. Probleemstatus

Zachte waarschuwing bovenaan, nooit paniektaal.

```text
Google heeft opnieuw je toestemming nodig
Je bestaande bestanden blijven veilig. Verbind
Google opnieuw om ook nieuwe bestanden te blijven bewaren.
[ Opnieuw verbinden ]
```

---

## 20. Mijn leven (onderscheidend scherm)

Geen folderstructuur; een chronologische tijdlijn. Scroll eindeloos terug door de
tijd.

```text
Mijn leven

2026 ──────────────────
Madeira      18 – 30 juli      134 foto's · 22 video's   [ collage ]
Parijs       14 – 15 augustus  87 foto's                 [ collage ]

2025 ──────────────────
San Francisco   238 foto's · 31 video's   [ collage ]
```

---

## 21. Jaarweergave

Klik op `2026`:

```text
2026
1.842 herinneringen
JAN FEB MRT APR MEI JUN
JUL AUG SEP OKT NOV DEC
```

AI kan gebeurtenissen voorstellen: _"We denken dat deze 184 foto's bij dezelfde
reis horen."_ `[ Maak hier Madeira 2026 van ]`. De gebruiker beslist.

---

## 22. Foto-overzicht

Visuele grid zoals Apple Photos, vrijwel randloos.

```text
Foto's
68.342 foto's
[ Alles ] [ Jaren ] [ Personen ] [ Plaatsen ]
Zoeken...
```

Filters: Datum · Bron · Persoon · Locatie.

---

## 23. Fotodetail

Foto groot centraal. Rechts (desktop):

```text
24 juli 2026
Madeira

Bronnen        Apple Foto's, Instagram
Personen       Hylke, [...]
Locatie        Calheta, Madeira
Toegevoegd aan archief   24 juli 2026
Origineel      HEIC · 4,8 MB
[ Download origineel ]
```

Nooit standaard alle EXIF-techniek tonen; technische metadata onder **Meer
informatie**.

---

## 24. Video's

Zelfde filosofie als foto's. Thumbnailgrid, duur rechtsonder, afspelen vanuit
beveiligde preview, origineel downloaden via detailpagina.

---

## 25. Documenten

Hier mag het iets zakelijker.

```text
Documenten
[ Zoek documenten ]

Categorieën
Identiteit 8 · Woning 24 · Financieel 82 · Verzekeringen 17
Contracten 31 · Belasting 68 · Opleiding 12 · Overig 214
```

Daaronder recent toegevoegd.

---

## 26. Documentdetail

Preview links, rechts:

```text
Hypotheekakte.pdf
Woning
Datum document   4 maart 2022
Bron             Google Drive
Veiliggesteld    18 september 2026
Toegang          Alleen ik
[ Download origineel ]
⋯
```

Later: **Delen met nalatenschap**.

---

## 27. Social

Eén uniforme tijdlijn, niet per platform beginnen.

```text
Social
[ Alles ] [ Instagram ] [ Facebook ] [ TikTok ]
```

Kaart bijvoorbeeld: Instagram · 12 juni 2018 · [ originele afbeelding ] · _"Eerste
dag in Italië 🇮🇹"_ · ❤️ 183. Broninformatie behouden indien beschikbaar; het
archief blijft zelfstandig bruikbaar als Instagram ooit verdwijnt.

---

## 28. Personen

```text
Personen
[ Hylke ]    12.482 herinneringen
[ partner ]  9.281 herinneringen
[ persoon ]  6.188 herinneringen
```

In eerste versies handmatig taggen. Gezichtsherkenning pas later en alleen na
expliciete privacybeslissing.

---

## 29. Persoonspagina

```text
Naam
12.482 herinneringen samen
1998 — 2026
```

Daaronder foto's, video's, gebeurtenissen en locaties. Kan later een krachtig
familieonderdeel worden.

---

## 30. Plaatsen

Kaart + lijst.

```text
Plaatsen
Nederland 32.402 · Frankrijk 4.821 · Verenigde Staten 3.812 · Portugal 2.382 · Japan ...
```

Klik op Madeira → alle herinneringen uit Madeira. Locatie alleen gebruiken
wanneer metadata beschikbaar is. Nooit locatie raden en als feit presenteren.

---

## 31. Zoeken

Grote universele zoekbalk.

```text
Waar ben je naar op zoek?
[ Madeira 2026 ]
```

Resultaatgroepen: Gebeurtenissen · Foto's · Video's · Documenten · Social. Later
natuurlijke taal: _"foto's van mijn kinderen op vakantie in Frankrijk"_.

---

## 32. Bronnenpagina

```text
Bronnen
Hier verzamelen we jouw digitale leven.

Verbonden
Apple Foto's   ✓ Alles veilig   Vandaag bijgewerkt   [ Beheren ]
Google Drive   ✓ Alles veilig   Vandaag bijgewerkt   [ Beheren ]

Nog niet verbonden
Instagram · Facebook · TikTok · etc.
```

---

## 33. Bron beheren

```text
Google Drive
✓ Alles veilig
2.842 bestanden

Eerste archivering   18 september 2026
Laatst bijgewerkt    Vandaag 14:18
Volgende controle    Morgen

Hoe vaak controleren?
○ Dagelijks  ○ Wekelijks  ○ Maandelijks
[ Nu controleren ]
──────────────────
Verbinding
[ Opnieuw verbinden ]
[ Verbinding verbreken ]
```

Onderaan: _Verbinding verbreken verwijdert niets wat al is veiliggesteld._

---

## 34. Familie

Emotionele tweede kern.

```text
Familie
Jouw familiearchief
[ Hylke ] [ Partner ] [ Kind ] [ Kind ]
+ Familielid toevoegen
```

Later kunnen familieleden eigen accounts krijgen. Niet noodzakelijk in MVP.

---

## 35. Als mij iets overkomt

Geen grafsteeniconen, geen zwart. Warm en rustig.

```text
Als mij iets overkomt
Bepaal wie toegang krijgt tot je digitale archief
wanneer jij dat zelf niet meer kunt.
Nog niet ingesteld
[ Instellen ]
```

---

## 36. Nalatenschap instellen

1. **Wie vertrouw je?** `[ + Vertrouwd persoon toevoegen ]`
2. **Waar mag deze persoon later bij?** ☑ Foto's en video's · ☑ Familiearchief ·
   ☑ Sociale media · ☐ Documenten
3. **Bevestiging** — _We vragen deze persoon om zijn of haar identiteit en
   contactgegevens te bevestigen._ `[ Uitnodiging versturen ]`

Automatische overdracht wordt nog niet geactiveerd in MVP.

---

## 37. Meldingen

Eenvoudige inbox; geen notificaties per individuele foto.

```text
Meldingen
Vandaag
✓ Google Drive is bijgewerkt — 2 nieuwe bestanden veiliggesteld
Gisteren
⚠ Google vraagt opnieuw toestemming
18 september
✓ Eerste archivering voltooid — 68.482 herinneringen veiliggesteld
```

---

## 38. Instellingen

Indeling: Mijn account · Beveiliging · Privacy · Archief · Meldingen · Abonnement
· Exporteren · Account verwijderen.

---

## 39. Beveiliging

```text
Beveiliging
Wachtwoord            •••••••••••• [ Wijzigen ]
Tweestapsverificatie  Aanbevolen  [ Instellen ]
Passkey                           [ Toevoegen ]
Actieve apparaten     MacBook Pro, iPhone [ Bekijk alles ]
```

---

## 40. Privacy

```text
Privacy
Jouw gegevens zijn van jou.
Verbonden diensten — Toestemmingen beheren
AI-functies [ uit / aan ]
Gebruiksgegevens [...]
Privacyverklaring
```

AI moet afzonderlijk bestuurbaar zijn.

---

## 41. Export (belangrijk voor vertrouwen)

```text
Mijn archief exporteren
Je kunt altijd een volledige kopie van je archief downloaden.
Dit bevat je oorspronkelijke bestanden en bijbehorende metadata.
[ Export maken ]
```

Daarna: _We maken je export klaar. Voor grote archieven kan dit enige tijd duren.
Je krijgt bericht wanneer hij gereed is._

---

## 42. Account verwijderen

Geen dark pattern.

```text
Account en archief verwijderen
Dit verwijdert uiteindelijk je volledige archief en kan niet
ongedaan worden gemaakt. Je verbonden bronnen worden niet gewijzigd.
[ Start verwijderprocedure ]
```

Daarna herauthenticatie en bevestiging.

---

## 43. Lege states

Nooit droog ("No data"), maar uitnodigend.

- **Geen foto's** → _Hier verschijnen de foto's die je veiligstelt._
  **[ Fotobron koppelen ]**
- **Geen documenten** → _Belangrijke documenten op één plek bewaren?_
  **[ Google Drive koppelen ]**

---

## 44. Loading states

Geen minutenlange draaiende loader. Bij lange taken:

```text
We stellen je foto's veilig
Dit kan op de achtergrond doorgaan.
2.842 van 8.191 voltooid
```

Gebruik skeletons voor gewone paginalading.

---

## 45. Succesmomenten

Na eerste complete archivering een echt moment:

```text
✓ Je eerste archief is veiliggesteld
68.482 herinneringen staan nu onafhankelijk van je
gekoppelde diensten bewaard.
Vanaf nu controleren we automatisch op nieuwe herinneringen.
[ Bekijk mijn archief ]
```

---

## 46. Vertrouwensindicator

Eén hoofdstatus bovenaan Dashboard en Bronnen: **Alles veilig ✓** /
**Bezig met veiligstellen** / **Actie nodig**. Niet twintig kleine rode bolletjes.

---

## 47. Geen opslagmeter als hoofdonderdeel

Primair: **68.482 herinneringen veiliggesteld**. Opslag mag onder abonnement staan
(`421 GB gebruikt`) maar nooit als belangrijkste productwaarde.

---

## 48. Homepage vóór login

Hero:

> # Alles wat je niet kwijt wilt.
> ## Op één veilige plek.
>
> Foto's, video's, sociale media en belangrijke documenten staan tegenwoordig
> overal. Verbind ze één keer en bouw automatisch een onafhankelijk digitaal
> archief voor jezelf en je familie.

CTA: **Start mijn archief** · Secundair: **Zo werkt het**.

Hero visual: een prachtige tijdlijn met familiebeelden en aan de zijkant subtiele
bronlogo's (Apple, Google, Instagram, Facebook, TikTok). Geen servers of slotjes
als hoofdvisual.

---

## 49. Homepage — hoe het werkt

```text
1  Verbind      Koppel de diensten die je toch al gebruikt.
2  Wij bewaren  We stellen je bestaande archief veilig en bewaren
                daarna nieuwe herinneringen automatisch.
3  Jij houdt het  Je archief blijft van jou en kan later worden doorgegeven.
```

---

## 50. Homepage — kernpropositie

> **Instagram bewaart Instagram. Google bewaart Google. Wij bewaren jou.**

Daaronder: _Je digitale leven raakt verspreid over steeds meer platforms. Dit
archief brengt het onafhankelijk samen._

---

## 51. Homepage — onafhankelijkheid

```text
Wat er ook met een platform gebeurt, jouw archief blijft bestaan.
✓ Een bericht wordt verwijderd
✓ Een account raakt geblokkeerd
✓ Een dienst stopt
✓ Je wisselt van telefoon
✓ Je stopt met een sociaal netwerk
```

Niet angstig formuleren, wel duidelijk.

---

## 52. Homepage — familie

> **Het fotoalbum van vroeger. Maar dan voor je hele digitale leven.**

Foto van ouder familiefotoalbum gecombineerd met moderne digitale tijdlijn. Sterke
emotionele propositie.

---

## 53. Responsive gedrag

- Desktop max contentbreedte ~`1440px`; contentkolommen meestal max `1200px`.
- Archief-grid: desktop 5–7 per rij · tablet 3–4 · mobiel 3.
- Documenten: desktop lijst/tabelhybride · mobiel cards.
- Tijdlijn: desktop ruime grote collages · mobiel verticale feed.

---

## 54. Component library

Herbruikbare componenten (geen schermspecifieke duplicaten waar een generieke
component kan):

```text
AppShell · Sidebar · MobileNavigation
PageHeader · SectionHeader
PrimaryButton · SecondaryButton · DangerButton · IconButton
SourceCard · ConnectedSourceCard · SourceStatus
ArchiveCard · PhotoCard · VideoCard · DocumentCard · SocialPostCard
StatusBanner · EmptyState · ProgressState · ErrorState
Modal · Drawer · Dropdown · Tabs · FilterBar · SearchBar
Avatar · PersonCard · EventCard · TimelineSection
Toast · NotificationItem
Skeleton
```

---

## 55. Design tokens

Centrale tokens voor: `colors, spacing, radius, shadow, typography, breakpoints,
animations, z-index`. Geen willekeurige waarden verspreid door componenten.
Spacing gebaseerd op een 4/8-pixel ritme.

---

## 56. Animatie

Zeer beperkt. Korte zachte transitions (150–250 ms) voor cards, modals, menus,
success states. Geen parallax, geen bewegende dashboards. Respecteer
`prefers-reduced-motion`.

---

## 57. Iconen

Eén consistente icon library (Lucide). Platformlogo's volgens hun brandingregels.
Geen emoji als permanente UI-iconen.

---

## 58. Fotografie

Foto's **zijn het product**: grote beelden, weinig frames, geen enorme overlays,
geen onnodige labels over foto's. Metadata verschijnt pas op verzoek.

---

## 59. Tone of voice

Kort, rustig, niet juridisch, niet technisch, niet kinderachtig.

- Goed: _"Je archief wordt bijgewerkt. Je hoeft niets te doen."_
  Niet: _"Background synchronisation task initiated successfully."_
- Goed: _"Instagram heeft opnieuw je toestemming nodig."_
  Niet: _"Instagram authentication token expired."_

---

## 60. De ultieme ervaring

Na een jaar openen voelt als:

```text
Goedemorgen Hylke
✓ Alles veilig

82.391 herinneringen worden voor je bewaard

6 jaar geleden
[ grote vakantiefoto ]
Madeira — 18 september 2020

Nieuw sinds je laatste bezoek
24 foto's · 2 video's · 3 documenten

Jouw bronnen
Apple Foto's ✓ · Instagram ✓ · Facebook ✓ · Google Drive ✓ · TikTok ✓
```

De gebruiker denkt niet _"mijn backupservice functioneert"_ maar **"Mijn leven
staat hier."** Dat is de onderscheidende designrichting.

---

## Implementatie-instructie

Behandel dit document als de **autoritatieve UX/UI-specificatie**. Vind tijdens
implementatie geen nieuwe visuele patronen uit waar een patroon al is
gedefinieerd. Bouw eerst een herbruikbaar designsysteem (tokens + component
library) en implementeer daarna schermen vanuit dat systeem. Begin met de
ingelogde application shell, onboarding en dashboard. Maak alle schermen
productiewaardig, responsive en WCAG 2.2 AA-compatibel (CLAUDE.md §52).
