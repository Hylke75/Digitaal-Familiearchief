import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { stripExtension } from '@/lib/archive/display';
import { sortAreas, toArea } from '@/lib/archive/document-areas';

export interface DocumentCard {
  id: string;
  title: string;
  sender: string | null;
  documentDate: string | null;
  expiresAt: string | null;
  /** Signed URL to a pre-rendered first-page image, or null (no preview yet). */
  previewUrl: string | null;
}

export interface DocumentArea {
  area: string;
  documents: DocumentCard[];
}

type DocRow = {
  id: string;
  original_filename: string;
  created_at_source: string | null;
  archived_at: string | null;
  metadata_json: Record<string, unknown> | null;
};

const BUCKET = 'archief';
// A few-hours signed preview: survives a browsing session, not a day (§42).
const SIGNED_TTL = 60 * 60 * 4;

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/**
 * The owner's documents grouped by life area, newest first within each area
 * (design advice, Advice B). Sender/area come from the retained metadata_json;
 * documents that predate metadata simply land in "Overig". PDFs carry a
 * pre-rendered first-page preview (a persisted derivative) so the tile shows the
 * actual document rather than a generic icon.
 */
export async function listDocuments(): Promise<DocumentArea[]> {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const { data } = await supabase
    .from('archive_items')
    .select('id, original_filename, created_at_source, archived_at, metadata_json')
    .eq('type', 'document')
    .order('created_at_source', { ascending: false, nullsFirst: false })
    .order('archived_at', { ascending: false })
    .limit(1000);

  const rows = (data ?? []) as DocRow[];

  // One batched lookup for every first-page preview, then ONE batch-sign request
  // for all of them (instead of a round-trip per document).
  const previewUrls = new Map<string, string>();
  if (rows.length > 0) {
    const { data: derivs } = await supabase
      .from('archive_derivatives')
      .select('archive_item_id, storage_key')
      .eq('kind', 'preview')
      .in(
        'archive_item_id',
        rows.map((r) => r.id),
      );
    const keyToItem = new Map((derivs ?? []).map((d) => [d.storage_key, d.archive_item_id]));
    const keys = [...keyToItem.keys()];
    if (keys.length > 0) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(keys, SIGNED_TTL);
      (signed ?? []).forEach((s) => {
        const itemId = s.path ? keyToItem.get(s.path) : undefined;
        if (s.signedUrl && itemId) previewUrls.set(itemId, s.signedUrl);
      });
    }
  }

  const byArea = new Map<string, DocumentCard[]>();
  for (const r of rows) {
    const meta = (r.metadata_json ?? {}) as Record<string, unknown>;
    const area = toArea(str(meta.gebied));
    const card: DocumentCard = {
      id: r.id,
      title: stripExtension(r.original_filename),
      sender: str(meta.afzender),
      documentDate: str(meta.documentDate) ?? r.created_at_source ?? r.archived_at,
      expiresAt: str(meta.expiresAt),
      previewUrl: previewUrls.get(r.id) ?? null,
    };
    (byArea.get(area) ?? byArea.set(area, []).get(area)!).push(card);
  }

  return sortAreas([...byArea.keys()]).map((area) => ({ area, documents: byArea.get(area)! }));
}
