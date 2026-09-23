import { extractText, getDocumentProxy } from 'unpdf';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';

const BUCKET = 'archief';

/**
 * Extract a document's text so it becomes searchable (design advice, Advice B —
 * "zoeken op fiets moet het garantiebewijs vinden, ook als het bestand
 * scan_0042.pdf heet"). Pure text extraction via unpdf's serverless pdfjs (no
 * native canvas). Bounded so metadata_json stays small; returns '' on failure.
 */
const MAX_CHARS = 40_000;

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  try {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const clean = (typeof text === 'string' ? text : String(text ?? ''))
      .replace(/\s+/g, ' ')
      .trim();
    return clean.slice(0, MAX_CHARS);
  } catch {
    return '';
  }
}

/**
 * Backfill searchable text for PDF documents that don't have it yet. Runs under
 * the service role in the cron worker; merges the text into metadata_json.
 * Idempotent and best-effort. Returns how many were processed.
 */
export async function extractDocumentTextBatch(
  admin: SupabaseClient<Database>,
  limit = 8,
): Promise<number> {
  const { data: docs } = await admin
    .from('archive_items')
    .select('id, storage_key, metadata_json')
    .eq('type', 'document')
    .eq('mime_type', 'application/pdf')
    .order('archived_at', { ascending: false })
    .limit(limit * 4);
  if (!docs || docs.length === 0) return 0;

  const todo = docs
    .filter((d) => {
      const m = (d.metadata_json ?? {}) as Record<string, unknown>;
      return typeof m.text !== 'string';
    })
    .slice(0, limit);

  let done = 0;
  for (const d of todo) {
    try {
      const { data: blob } = await admin.storage.from(BUCKET).download(d.storage_key);
      if (!blob) continue;
      const text = await extractPdfText(new Uint8Array(await blob.arrayBuffer()));
      const merged = { ...((d.metadata_json ?? {}) as Record<string, unknown>), text };
      await admin
        .from('archive_items')
        .update({ metadata_json: merged as never })
        .eq('id', d.id);
      done += 1;
    } catch {
      // Undecodable PDF → skip; a later tick may retry.
    }
  }
  return done;
}
