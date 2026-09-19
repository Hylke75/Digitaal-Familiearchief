import { unzip, type UnzipFileInfo } from 'fflate';

/**
 * Safe ZIP extraction (CONNECTORS_BUILD.md §25). Guards against zip bombs
 * (per-entry and total decompressed-size caps, entry-count cap) and path
 * traversal (rejects `..` segments and absolute paths). Directory entries and
 * unsafe names are skipped rather than extracted; content is never executed.
 */
export interface ZipSafetyLimits {
  maxEntries: number;
  maxEntrySize: number; // decompressed bytes per file
  maxTotalSize: number; // decompressed bytes across the archive
}

export const DEFAULT_ZIP_LIMITS: ZipSafetyLimits = {
  maxEntries: 200_000,
  maxEntrySize: 2 * 1024 * 1024 * 1024, // 2 GiB
  maxTotalSize: 50 * 1024 * 1024 * 1024, // 50 GiB
};

export class ZipSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ZipSafetyError';
  }
}

/** True if a zip entry name is safe to extract (no traversal, not absolute). */
export function isSafeEntryName(name: string): boolean {
  if (!name || name.endsWith('/')) return false; // empty or directory
  if (name.startsWith('/') || name.startsWith('\\')) return false;
  if (/^[a-zA-Z]:[\\/]/.test(name)) return false; // Windows drive path
  const parts = name.split(/[\\/]/);
  return !parts.some((p) => p === '..');
}

export async function readZipSafely(
  data: Uint8Array,
  limits: ZipSafetyLimits = DEFAULT_ZIP_LIMITS,
): Promise<Map<string, Uint8Array>> {
  let total = 0;
  let count = 0;

  return new Promise((resolve, reject) => {
    unzip(
      data,
      {
        filter(file: UnzipFileInfo) {
          if (file.name.endsWith('/')) return false; // directory
          if (!isSafeEntryName(file.name)) return false; // unsafe path → skip
          if (file.originalSize > limits.maxEntrySize) {
            reject(new ZipSafetyError(`Entry exceeds size limit: ${file.name}`));
            return false;
          }
          count += 1;
          if (count > limits.maxEntries) {
            reject(new ZipSafetyError('Too many entries in archive'));
            return false;
          }
          total += file.originalSize;
          if (total > limits.maxTotalSize) {
            reject(new ZipSafetyError('Archive decompressed size exceeds limit'));
            return false;
          }
          return true;
        },
      },
      (err, unzipped) => {
        if (err) return reject(err);
        const out = new Map<string, Uint8Array>();
        for (const [name, bytes] of Object.entries(unzipped)) {
          if (isSafeEntryName(name)) out.set(name, bytes);
        }
        resolve(out);
      },
    );
  });
}

/** List entry names without decompressing (for detection). */
export async function listZipEntries(data: Uint8Array): Promise<string[]> {
  const names: string[] = [];
  return new Promise((resolve, reject) => {
    unzip(
      data,
      {
        filter(file: UnzipFileInfo) {
          names.push(file.name);
          return false; // do not decompress; we only want names
        },
      },
      (err) => {
        if (err) return reject(err);
        resolve(names);
      },
    );
  });
}
