'use server';

import { revalidatePath } from 'next/cache';
import type { Json } from '@dla/database';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { isDemoSession } from '@/lib/demo-guard';
import { getHandwritingReader } from '@/lib/ai/handwriting';

const BUCKET = 'archief';
const RENDERABLE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

export interface HandwritingResult {
  text?: string;
  error?: 'auth' | 'demo' | 'not_found' | 'not_image' | 'not_configured' | 'failed' | 'empty';
}

/**
 * Lees het handschrift van één foto op verzoek van de eigenaar. De afbeelding
 * gaat alleen naar de externe dienst als de gebruiker hier zelf om vraagt (§35).
 * We verkleinen de foto eerst (goedkoper), sturen hem naar het vision-model en
 * schrijven de tekst terug in metadata_json.text — meteen doorzoekbaar. Het
 * origineel blijft onaangetast; de kluis wordt nooit verstuurd.
 */
export async function readHandwritingAction(itemId: string): Promise<HandwritingResult> {
  if (!itemId) return { error: 'not_found' };
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return { error: 'auth' };
  if (await isDemoSession(supabase)) return { error: 'demo' };

  const { data: item } = await supabase
    .from('archive_items')
    .select('id, type, mime_type, storage_key')
    .eq('id', itemId)
    .maybeSingle();
  if (!item) return { error: 'not_found' };
  if (item.type !== 'photo' || !RENDERABLE.has(item.mime_type)) return { error: 'not_image' };

  const reader = getHandwritingReader();
  if (!reader) return { error: 'not_configured' };

  // Verkleinen via transform → kleiner/goedkoper verzoek; als data-URL versturen.
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(item.storage_key, 300, {
      transform: { width: 2000, height: 2000, resize: 'contain', quality: 80 },
    });
  if (!signed?.signedUrl) return { error: 'failed' };

  let dataUrl: string;
  try {
    const res = await fetch(signed.signedUrl);
    if (!res.ok) return { error: 'failed' };
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await res.arrayBuffer());
    dataUrl = `data:${contentType};base64,${buf.toString('base64')}`;
  } catch {
    return { error: 'failed' };
  }

  let text: string;
  try {
    text = await reader.read(dataUrl);
  } catch {
    return { error: 'failed' };
  }

  if (!text) {
    await supabase.rpc('archive_update_item', {
      p_id: itemId,
      p_metadata: { handwriting_status: 'empty' } as Json,
    });
    return { error: 'empty' };
  }

  await supabase.rpc('archive_update_item', {
    p_id: itemId,
    p_metadata: { text, handwriting_status: 'done' } as Json,
  });
  revalidatePath(`/archief/${itemId}`);
  return { text };
}
