/**
 * Pure datumhulp voor scans. Een ingescande oude foto heeft vaak geen EXIF; de
 * gebruiker mag een jaartal opgeven zodat de foto in de tijdlijn op zijn plek
 * belandt. We normaliseren dat naar een ISO-datum (midden op 1 januari, zodat
 * hij nooit vóór of ná de dag zelf springt). Apart gehouden om te testen.
 */
export function scannedTakenAtIso(
  yearInput: string | null | undefined,
  maxYear: number,
): string | null {
  const s = (yearInput ?? '').trim();
  if (!/^\d{4}$/.test(s)) return null;
  const year = Number(s);
  // Fotografie bestaat sinds ~1826; nooit een jaar in de toekomst.
  if (year < 1826 || year > maxYear) return null;
  return `${s}-01-01T12:00:00.000Z`;
}
