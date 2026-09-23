import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * §9 boundary: the archive domain packages must depend ONLY on the
 * `ArchiveStorageProvider` abstraction, never on a concrete backend. If any of
 * them imports `@supabase/*` the storage layer is no longer replaceable. This
 * test walks their source and fails on a forbidden import.
 */
const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DOMAIN_PACKAGES = ['packages/archive/src', 'packages/connectors/src', 'packages/storage/src'];

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsFiles(full));
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

describe('§9 storage abstraction boundary', () => {
  it('domain packages never import a concrete storage backend (@supabase/*)', () => {
    const offenders: string[] = [];
    for (const pkg of DOMAIN_PACKAGES) {
      for (const file of tsFiles(join(root, pkg))) {
        const src = readFileSync(file, 'utf8');
        if (/from\s+['"]@supabase\//.test(src) || /require\(\s*['"]@supabase\//.test(src)) {
          offenders.push(file.replace(root + '/', ''));
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
