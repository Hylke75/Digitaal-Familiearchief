import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'archief';
const TTL = 60 * 60 * 4;
const RENDERABLE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

/**
 * Returns a fresh signed thumbnail URL for one item so a client `<img>` can
 * recover from an expired link (a tab left open past the signed-URL TTL). RLS
 * restricts the lookups to the owner, so this never leaks another user's media.
 * Mirrors the tile-signing logic: a persisted derivative (thumb/poster) wins;
 * otherwise a renderable original is transformed on the fly.
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ url: null }, { status: 401 });

  const { data: item } = await supabase
    .from('archive_items')
    .select('storage_key, mime_type')
    .eq('id', params.id)
    .maybeSingle();
  if (!item) return NextResponse.json({ url: null }, { status: 404 });

  const { data: deriv } = await supabase
    .from('archive_derivatives')
    .select('storage_key')
    .eq('archive_item_id', params.id)
    .in('kind', ['thumb', 'poster', 'preview'])
    .maybeSingle();

  let url: string | null = null;
  if (deriv?.storage_key) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(deriv.storage_key, TTL);
    url = data?.signedUrl ?? null;
  } else if (RENDERABLE.has(item.mime_type)) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(item.storage_key, TTL, {
      transform: { width: 600, height: 600, resize: 'cover', quality: 60 },
    });
    url = data?.signedUrl ?? null;
  }

  return NextResponse.json({ url }, { headers: { 'cache-control': 'no-store' } });
}
