/**
 * Pure document life-area helpers (no I/O, unit-tested). Documents are ordered
 * by meaning, not by date (design advice, Advice B): a life area (wonen, geld,
 * verzekeringen …) is the first ordering. Areas with content are shown in a
 * sensible fixed order, then any unknown ones alphabetically, with "Overig"
 * always last.
 */

/** Preferred display order for the known life areas. */
export const AREA_ORDER = [
  'Officieel',
  'Woning',
  'Geld',
  'Belasting',
  'Financieel',
  'Verzekeringen',
  'Voertuigen',
  'Zorg',
  'Opleiding',
  'Werk en studie',
  'Contracten',
  'Aankopen',
  'Familiearchief',
] as const;

const FALLBACK = 'Overig';

/** Normalise a raw category to a non-empty area label. */
export function toArea(raw: string | null | undefined): string {
  const t = (raw ?? '').trim();
  return t || FALLBACK;
}

/** Order a set of area names: known order first, then unknown A→Z, Overig last. */
export function sortAreas(areas: string[]): string[] {
  const rank = new Map<string, number>(AREA_ORDER.map((a, i) => [a, i]));
  const unique = Array.from(new Set(areas));
  return unique.sort((a, b) => {
    if (a === FALLBACK) return 1;
    if (b === FALLBACK) return -1;
    const ra = rank.get(a);
    const rb = rank.get(b);
    if (ra != null && rb != null) return ra - rb;
    if (ra != null) return -1;
    if (rb != null) return 1;
    return a.localeCompare(b, 'nl');
  });
}
