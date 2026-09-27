/**
 * Documenten als mappenboom (net als Google Drive). De boom komt uit het bronpad
 * van elk document — het pad waar het bij de bron stond (Mijn Drive/Privé/…).
 * Pure module: paden-in, boom-uit, zodat de logica los te testen is.
 */

/** Haal het mappad uit de metadata: eerst een net `map`-veld (wat bron-connectors
 * later zetten), anders geparset uit de bewaarde documenttekst ("Map: …"). */
export function parseFolderSegments(meta: Record<string, unknown> | null | undefined): string[] {
  const m = meta ?? {};
  let raw: string | null = null;
  if (typeof m.map === 'string' && m.map.trim()) {
    raw = m.map.trim();
  } else if (typeof m.text === 'string') {
    const hit = m.text.match(/Map:\s*(.+?)\s+Documentdatum:/);
    if (hit && hit[1]) raw = hit[1].trim();
  }
  if (!raw) return [];
  return raw
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface FolderTreeItem {
  folderPath: string[];
  /** Bronlabel van het item (afzender), voor het bronlogo per map. */
  source?: string | null;
}

export interface SubFolder {
  name: string;
  /** Volledig pad tot en met deze map (voor navigatie/links). */
  path: string[];
  /** Aantal documenten in deze map én al zijn submappen. */
  count: number;
  /** Meest voorkomende bron in deze map (of null), voor het bronlogo. */
  source: string | null;
}

export interface FolderView<T> {
  folders: SubFolder[];
  files: T[];
}

function isUnder(path: string[], prefix: string[]): boolean {
  if (path.length < prefix.length) return false;
  return prefix.every((seg, i) => path[i] === seg);
}

/**
 * De inhoud van één map: de directe submappen (met recursieve telling) en de
 * bestanden die rechtstreeks in deze map staan. `current` = het huidige pad
 * (leeg = wortel).
 */
export function folderView<T extends FolderTreeItem>(items: T[], current: string[]): FolderView<T> {
  const counts = new Map<string, number>();
  const sources = new Map<string, Map<string, number>>();
  const files: T[] = [];
  for (const it of items) {
    if (!isUnder(it.folderPath, current)) continue;
    const rest = it.folderPath.slice(current.length);
    const next = rest[0];
    if (next === undefined) {
      files.push(it);
    } else {
      counts.set(next, (counts.get(next) ?? 0) + 1);
      const src = it.source?.trim();
      if (src) {
        const tally = sources.get(next) ?? new Map<string, number>();
        tally.set(src, (tally.get(src) ?? 0) + 1);
        sources.set(next, tally);
      }
    }
  }
  const folders: SubFolder[] = [...counts.entries()]
    .map(([name, count]) => ({
      name,
      path: [...current, name],
      count,
      source: dominant(sources.get(name)),
    }))
    // Grootste mappen eerst, bij gelijk aantal alfabetisch.
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'nl'));
  return { folders, files };
}

/** Meest voorkomende sleutel in een tally (of null). */
function dominant(tally: Map<string, number> | undefined): string | null {
  if (!tally) return null;
  let best: string | null = null;
  let bestN = 0;
  for (const [key, n] of tally) {
    if (n > bestN) {
      bestN = n;
      best = key;
    }
  }
  return best;
}

/** Kruimelpad-segmenten met hun cumulatieve pad, voor de navigatiebalk. */
export function breadcrumbs(current: string[]): Array<{ name: string; path: string[] }> {
  return current.map((name, i) => ({ name, path: current.slice(0, i + 1) }));
}

/** Serialiseer/deserialiseer een pad naar de `?pad=`-query (segmenten met `/`). */
export function encodePath(path: string[]): string {
  return path.join('/');
}
export function decodePath(pad: string | undefined): string[] {
  if (!pad) return [];
  return pad
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
}
