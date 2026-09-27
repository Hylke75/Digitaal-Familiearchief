# Media provenance & versions

Bewora stores **one** canonical copy of an identical binary and preserves every
source relationship (CLAUDE.md §22, §23, §48). The demo demonstrates this
end-to-end.

## Multiple sources, one item (§7, §62)

Some photos were found in more than one place. They appear **once** in the
library, timeline, places and albums; the detail view shows all sources.

| Photo            | Origineel      | Ook gevonden in |
| ---------------- | -------------- | --------------- |
| `demo-photo-001` | Apple Foto's   | Google Photos   |
| `demo-photo-007` | Apple Foto's   | Google Photos   |
| `demo-photo-013` | Google Photos  | Apple Foto's    |
| `demo-photo-019` | Apple Foto's   | Google Photos (bron verwijderd) |

The detail screen reads **"Herkomst · 2 bronnen"** and lists both.

## Source deletion ≠ Bewora deletion (§4, §49)

On `demo-photo-019` the Google Photos relation carries `sourceDeletedAt`. The
provider copy disappeared, but the canonical item stays visible everywhere and
remains downloadable. The UI states: *"Bij Google Photos verwijderd — je
archiefkopie blijft bewaard."*

## Versions (§8)

`demo-photo-001` has a related **WhatsApp-compressed version**
(`relationship: WHATSAPP_COMPRESSED_VERSION`). It is grouped under the original
in the **Versies** section of the detail view, not shown as a duplicate tile:

```
Versies
  Origineel        · Apple Foto's
  WhatsApp-versie  · Gecomprimeerd
```

## User override (§50)

`demo-photo-006` (Madeira tennis) carries a provider place value ("Calheta") and
a user override ("Tennisclub Calheta"). The UI displays the **override** and
notes the provider value; a source refresh must never replace a user override.

## Source view is by origin; provenance is per item

The **Bronnen** photo view filters by primary origin, so the six source cards sum
to the visible library (30). Provenance (multiple sources, versions) is shown on
the item, and place/album **source distribution** is computed from every source
relation of the member items — which is how Madeira can show three sources.

## Favourites (§51)

`favorite` is Bewora's own state, distinct from any provider "favourite". It is
seeded on several items and is a combinable filter.
