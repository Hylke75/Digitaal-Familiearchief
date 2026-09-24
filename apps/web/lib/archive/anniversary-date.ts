/**
 * Pure datumkern van de jubilea (apart gehouden zodat de logica getest kan
 * worden zonder server-afhankelijkheden).
 */

/**
 * Aantal jaren geleden dat een ISO-datum op dezelfde maand+dag als de peildatum
 * viel, of null als het niet dezelfde dag is of in hetzelfde/later jaar valt.
 */
export function anniversaryYearsAgo(
  iso: string | null | undefined,
  ref: { year: number; month: number; day: number },
): number | null {
  if (!iso || iso.length < 10) return null;
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  if (!Number.isFinite(year) || month !== ref.month || day !== ref.day) return null;
  const yearsAgo = ref.year - year;
  return yearsAgo > 0 ? yearsAgo : null;
}
