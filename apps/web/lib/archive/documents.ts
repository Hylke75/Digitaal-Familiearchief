import { createClient } from '@/lib/supabase/server';
import { stripExtension } from '@/lib/archive/display';
import { sortAreas, toArea } from '@/lib/archive/document-areas';

export interface DocumentCard {
  id: string;
  title: string;
  sender: string | null;
  documentDate: string | null;
  expiresAt: string | null;
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

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/**
 * The owner's documents grouped by life area, newest first within each area
 * (design advice, Advice B). Sender/area come from the retained metadata_json;
 * documents that predate metadata simply land in "Overig".
 */
export async function listDocuments(): Promise<DocumentArea[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('archive_items')
    .select('id, original_filename, created_at_source, archived_at, metadata_json')
    .eq('type', 'document')
    .order('created_at_source', { ascending: false, nullsFirst: false })
    .order('archived_at', { ascending: false })
    .limit(1000);

  const rows = (data ?? []) as DocRow[];
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
    };
    (byArea.get(area) ?? byArea.set(area, []).get(area)!).push(card);
  }

  return sortAreas([...byArea.keys()]).map((area) => ({ area, documents: byArea.get(area)! }));
}
