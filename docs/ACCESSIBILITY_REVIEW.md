# Accessibility Review — Brand Refresh

Target: **WCAG 2.2 AA**. This review covers the refreshed brand palette and the
rebuilt public homepage (docs BRAND_UPDATE §9, §56).

## Colour contrast (computed against the relevant background)

| Foreground | Background | Ratio | Use | Result |
| --- | --- | --- | --- | --- |
| Charcoal `#1B211D` | Warm Paper `#FAF6F1` | ~15:1 | Primary text | ✅ AAA |
| Secondary `#59635C` | Warm Paper `#FAF6F1` | ~5:1 | Secondary text | ✅ AA |
| White | Archive Green `#1D3D2A` | ~11:1 | Primary button text | ✅ AAA |
| Archive Green `#1D3D2A` | White | ~10:1 | Links, headings | ✅ AAA |
| Warning `#8A4B12` | White / Warm Paper | ~6:1 / ~5.5:1 | Warning text | ✅ AA |
| Brass `#9B5B19` | White | ~5:1 | Accent text/icons | ✅ AA |
| Interactive border `#7F8981` | White / Warm Paper | ~3.6:1 / ~3.4:1 | Form control boundary | ✅ ≥3:1 |

### Fixed
- **Warning text** was `#C67A19` (~2.9:1 on white — **fail**). Now `#8A4B12` (~6:1). ✅
- **Form control boundary**: added `border-strong` `#7F8981` (≥3:1) for required
  interactive boundaries; decorative card border `#E5E7E3` remains for non-control chrome.
- **Focus ring** updated to Archive Green `#1D3D2A`, 2px, 2px offset — visible on all backgrounds.

## Not colour-alone
- Source/status use text labels (“Veiliggesteld”, “Binnenkort”, “Importeren”) alongside colour.
- Independence section uses an **event → result** model with an arrow, not a ✓ next to problems.
- Capability chips show a text label, not only a colour.

## Structure / semantics
- Single `<h1>` on the homepage; sections use `<h2>`/`<h3>` in order.
- FAQ and mobile menu use native `<details>/<summary>` (keyboard-operable, no JS).
- Logo is a labelled link (`aria-label="Bewora"`); the mark is `aria-hidden`.
- Decorative visuals (timeline, photo tiles, product-preview chrome) are `aria-hidden`.
- Images use descriptive `alt` (archive grid uses the filename).

## Keyboard / focus
- All interactive elements are native links/buttons/summary → tab-navigable.
- `:focus-visible` ring applied globally.

## Remaining / to verify
- Run an automated axe/Lighthouse pass on the deployed page.
- Real photography (when added) must include meaningful `alt`.
- Reduced-motion is respected globally; verify any future animation honours it.
