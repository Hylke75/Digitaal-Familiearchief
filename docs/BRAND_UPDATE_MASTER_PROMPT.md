# BEWORA — COMPLETE BRAND, UX AND WEBSITE REVISION

You are working in the existing Bewora repository.

Do NOT start a new project.

Before changing code:

1. Inspect the complete repository.
2. Read CLAUDE.md.
3. Read all existing files in /docs.
4. Inspect `/public/brand/bewora-logo-reference.png`.
5. Inspect `/public/references/bewora-platform-mockup.png`.
6. Identify existing reusable components.
7. Identify all old branding tokens and copy.
8. Create a concise implementation plan.
9. Then execute this complete revision.

## Brand positioning

Bewora is not primarily cloud storage, backup software, a digital safe, a password manager or a death/legacy product.

Bewora aims to own the category:

**An automatic independent archive of your existing digital life.**

Core mechanism:

**Koppelen → Bewaren → Terugvinden → Doorgeven**

Primary brand line:

**Bewaar wat van jou is.**

International:

**Keep what’s yours.**

Primary homepage statement:

**Instagram bewaart Instagram. Google bewaart Google. Bewora bewaart jou.**

Supporting text:

**Koppel je foto's, sociale media en documenten één keer. Bewora verzamelt ze automatisch in een onafhankelijk digitaal archief dat van jou blijft.**

## Visual identity

Update the main palette:

- Archive Green: `#1D3D2A`
- Archive Green Dark: `#142C1E`
- Warm Paper: `#FAF6F1`
- Surface: `#FFFFFF`
- Brass: `#9B5B19`
- Charcoal Green: `#1B211D`
- Secondary Text: `#59635C`
- Sage: `#A8B4A9`
- Warning Text: `#8A4B12`

Fix interactive border contrast and other WCAG 2.2 AA issues.

Do not use the previous warning colour `#C67A19` for normal text.
Do not use `#E5E7E3` as the only required boundary for form controls.

## Logo

Use the existing logo reference only as a starting point.

Retain a stylised Bewora B, but reduce the leaf/botanical reading.

Refine it toward:
- pages
- archive layers
- preserved memories
- open book
- continuity/time

Avoid:
- leaf as dominant symbol
- locks
- shields
- clouds
- folders
- databases
- generic infinity icons

Create/update production assets in `/public/brand`.

## Homepage structure

Rebuild homepage in this order:

1. Header
2. Hero
3. Recognisable platform services
4. Actual product proof
5. How it works — exactly 3 steps
6. What Bewora preserves
7. Archive/timeline experience
8. Ownership/export proof
9. Family section
10. Digital independence
11. Trust/evidence
12. Pricing
13. FAQ
14. Final CTA
15. Complete footer

Do not leave the homepage as a short abstract five-section site.

## Hero

Headline:

**Instagram bewaart Instagram.
Google bewaart Google.
Bewora bewaart jou.**

Body:

**Koppel je foto's, sociale media en documenten één keer. Bewora verzamelt ze automatisch in een onafhankelijk digitaal archief dat van jou blijft.**

Primary CTA:
**Start mijn archief**

Secondary:
**Bekijk hoe het werkt**

The primary CTA must dominate visually.

Show actual Bewora product UI to the right. No empty decorative rectangle.

## Platform recognition

Show recognisable services where relevant:
- Apple Foto's
- Google Photos
- Google Drive
- Instagram
- Facebook
- TikTok
- OneDrive
- Dropbox

Do not imply identical capabilities.

Capability data must come from the connector registry where possible.

## Product proof

Create a public product preview based on the real product using synthetic demo data.

Show:
- Dashboard
- Photos
- My Life
- Sources
- Documents
- Export

Do not use fake company metrics. Demo values must clearly remain demo archive data.

## How it works

Exactly 3 steps:

1. **Koppel**
   “Kies de diensten die je gebruikt en geef toestemming.”

2. **Bewora bewaart**
   “We stellen je bestaande archief veilig en bewaren daarna nieuwe content automatisch waar de gekoppelde dienst dat ondersteunt.”

3. **Jij houdt het**
   “Je archief blijft onafhankelijk beschikbaar en is altijd exporteerbaar.”

## What Bewora preserves

Create concrete product categories:
- Foto's en video's
- Sociale media
- Documenten

Do not advertise unsupported functionality.

## Ownership

Create a major section:

# Jouw archief. Echt van jou.

Explain export, standard formats and no lock-in.

Show:
**Download mijn volledige archief**

Only if the functionality is actually implemented.

If not yet implemented, implement the real export feature before presenting it publicly as available.

## What if Bewora stops?

Create an explicit subsection.

Use truthful language such as:

“Daarom bouwen we Bewora zo dat je altijd een volledige export van je eigen archief kunt maken. Je bestanden mogen nooit afhankelijk zijn van één leverancier — ook niet van ons.”

Do not promise eternal storage or bankruptcy continuity unless legally and financially valid.

## Family

Use:

# Het fotoalbum van vroeger.
# Maar dan voor je hele digitale leven.

Use photography of family, daily life, children growing up, grandparents, birthdays, holidays and old/new photos.

Do not fill the site with generic landscapes.

## Digital independence

Use a cause/result visual, not green checkmarks next to disasters.

Example:

Instagram-foto verwijderd
→
Bewora-kopie blijft bewaard

## Trust

Never fabricate:
- testimonials
- ratings
- certifications
- users
- partner logos
- audits
- media coverage
- company details
- server location

Only render verified trust facts.

Until social proof exists, prioritise:
- actual product UI
- clear privacy
- clear security
- export
- accurate provider explanations
- verified company/contact information

## Pricing

Pricing must exist as a central config.

Do not invent prices.

If pricing is undecided:
- create `/src/config/pricing.ts`
- keep it unpublished or clearly development-only
- report “Pricing decision required.”

## FAQ

Include at least:
- Wat is Bewora?
- Hoe werkt Bewora?
- Verplaatst Bewora mijn bestanden?
- Wat gebeurt er als ik iets bij de bron verwijder?
- Kan ik alles weer downloaden?
- Welke diensten kan ik koppelen?
- Blijft Bewora automatisch bijwerken?
- Kan ik een koppeling verbreken?
- Wat als Bewora stopt?
- Waar worden mijn gegevens opgeslagen?
- Kan Bewora mijn foto's en documenten bekijken?
- Worden mijn gegevens gebruikt om AI te trainen?

Answers must match actual architecture.

Do not claim zero-knowledge/E2E encryption unless implemented.

## Contact/footer

Create or verify `/contact`.

Footer groups:
- Product
- Bedrijf
- Vertrouwen
- Account

Use:
**Bewaar wat van jou is.**

Only display verified company information.

## Brand config

Centralise in `src/config/brand.ts` or equivalent:
- name
- taglines
- hero copy
- colours
- logos
- company metadata
- contact
- legal URLs

## Design tokens

Centralise colour, radius, shadow, spacing, typography, breakpoints and motion.

Do not scatter arbitrary values.

## Authenticated product

Do not redesign the core application.

Apply:
- new brand colours
- logo
- accessibility fixes
- copy consistency
- focus states
- form borders

Preserve the approved UX.

## Source cards

Clearly distinguish actual capability using consumer language:
- Automatisch gekoppeld
- Archief importeren
- Foto's selecteren
- Binnenkort beschikbaar

Never make Snapchat look identical to OneDrive if capabilities differ.

## Photography

Use real-feeling European/family imagery:
- ordinary home moments
- children
- grandparents
- holidays
- birthdays
- old photographs
- recent phone photography

Avoid obvious corporate stock imagery.

## Time motif

Introduce the subtle timeline motif throughout brand/marketing where appropriate.

## Marketing claim policy

No:
- “100% veilig”
- “unhackable”
- “zero knowledge”
- “end-to-end encrypted”
- “voor altijd”

unless actually proven/implemented.

## SEO

Homepage title example:

**Bewora — Bewaar je digitale leven onafhankelijk**

Description:

**Koppel je foto's, sociale media en documenten. Bewora brengt je digitale leven samen in een onafhankelijk archief dat van jou blijft.**

Use natural Dutch SEO language without keyword stuffing.

## Open Graph

Create/update OG artwork with:
- Bewora logo
- “Bewaar wat van jou is.”
- subtle product/timeline motif

Avoid locks, servers and cloud icons.

## Accessibility

Perform a complete WCAG 2.2 AA-oriented review:
- text contrast
- form control boundaries
- focus states
- keyboard
- modal focus
- icon labels
- heading order
- mobile menu
- alt text

Create `docs/ACCESSIBILITY_REVIEW.md`.

## Documentation

Create/update:
- `docs/BRAND.md`
- `docs/POSITIONING.md`
- `docs/DESIGN.md`
- `docs/ACCESSIBILITY_REVIEW.md`

## Execution order

1. Audit current branding/homepage/styles.
2. Update brand config and tokens.
3. Update logo/assets.
4. Fix accessibility colours.
5. Apply updated brand to authenticated product.
6. Rebuild homepage.
7. Create product proof/demo.
8. Implement ownership/export section.
9. Implement audience sections.
10. Implement trust architecture.
11. Implement pricing framework.
12. Implement FAQ/contact/footer.
13. Responsive pass.
14. Accessibility pass.
15. SEO/metadata/OG pass.
16. Run lint/typecheck/tests/build.

Do not stop after the hero.

Complete every non-blocked part.

If a true business fact is missing, do not invent it. Report the required owner decision and continue with everything else.

## Final review

Review as:
A. someone who has never heard of Bewora
B. a non-technical parent
C. a privacy-conscious user
D. someone thinking about preserving family history

The visitor should understand:
- what Bewora does
- what they connect
- that existing history is imported
- that Bewora continues archiving where possible
- that the archive is independent
- that export exists
- what the product looks like
- which providers actually work

## Final principle

Bewora is not selling storage capacity.

Bewora is selling continuity and ownership.

The user connects the places where their digital life already exists.

Bewora preserves an independent copy.

The archive remains usable outside those platforms.

Bewora proves that promise through portability.
