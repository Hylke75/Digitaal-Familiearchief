'use server';

import { revalidatePath } from 'next/cache';
import type { Json } from '@dla/database';
import { createClient } from '@/lib/supabase/server';
import { isDemoSession } from '@/lib/demo-guard';

/**
 * Correct a memory: its title and capture date (§Permanent — dates are
 * correctable), plus document fields merged into metadata_json (sender, type,
 * document date, labels, expiry). Owner-scoped via the archive_update_item RPC;
 * a no-op for the shared demo account.
 */
export async function updateItemAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = createClient();
  if (await isDemoSession(supabase)) {
    revalidatePath(`/archief/${id}`);
    return;
  }

  const title = String(formData.get('title') ?? '').trim();
  const dateStr = String(formData.get('takenAt') ?? '').trim();
  const takenAt = dateStr ? new Date(dateStr).toISOString() : null;

  // Optional document fields — only merged when present on the form.
  const meta: Record<string, string | null> = {};
  for (const key of ['afzender', 'soort', 'documentDate', 'expiresAt', 'gebied'] as const) {
    if (formData.has(key)) meta[key] = String(formData.get(key) ?? '').trim() || null;
  }
  if (formData.has('labels')) {
    const raw = String(formData.get('labels') ?? '').trim();
    (meta as Record<string, unknown>).labels = raw
      ? raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;
  }

  await supabase.rpc('archive_update_item', {
    p_id: id,
    p_taken_at: takenAt ?? undefined,
    p_original_filename: title || undefined,
    p_metadata: Object.keys(meta).length > 0 ? (meta as Json) : undefined,
  });

  revalidatePath(`/archief/${id}`);
  revalidatePath('/mijn-leven');
  revalidatePath('/documenten');
}
