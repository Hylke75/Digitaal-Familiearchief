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
}

export interface SubFolder {
  name: string;
  /** Volledig pad tot en met deze map (voor navigatie/links). */
  path: string[];
  /** Aantal documenten in deze map én al zijn submappen. */
  count: number;
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
  const files: T[] = [];
  for (const it of items) {
    if (!isUnder(it.folderPath, current)) continue;
    const rest = it.folderPath.slice(current.length);
    const next = rest[0];
    if (next === undefined) {
      files.push(it);
    } else {
      counts.set(next, (counts.get(next) ?? 0) + 1);
    }
  }
  const folders: SubFolder[] = [...counts.entries()]
    .map(([name, count]) => ({ name, path: [...current, name], count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'nl'));
  return { folders, files };
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
