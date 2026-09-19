import { IMPORTERS } from './importers';
import type { ArchiveImporter, DetectionResult } from './types';

/**
 * Automatically detect which provider an uploaded archive belongs to
 * (CONNECTORS_BUILD.md §26) — the user should not have to say "which provider is
 * this?". Returns the highest-confidence importer; the generic importer is the
 * always-available fallback.
 */
export function detectImporter(entryNames: string[]): {
  importer: ArchiveImporter;
  result: DetectionResult;
} {
  let best = IMPORTERS[IMPORTERS.length - 1]!; // generic fallback
  let bestScore = best.detect(entryNames);
  for (const importer of IMPORTERS) {
    const score = importer.detect(entryNames);
    if (score > bestScore) {
      best = importer;
      bestScore = score;
    }
  }
  return {
    importer: best,
    result: { importerKey: best.key, displayName: best.displayName, confidence: bestScore },
  };
}
