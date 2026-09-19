import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseStorageProvider } from '@/lib/archive/supabase-storage';

/**
 * Secure original download. Looks up the item under RLS (so only the owner can
 * reach it), then issues a short-lived signed URL and redirects to it
 * (docs/DESIGN.md §31, CLAUDE.md §42 — signed access, short expiry).
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/inloggen', _request.url));

  const { data: item } = await supabase
    .from('archive_items')
    .select('storage_key')
    .eq('id', params.id)
    .maybeSingle();

  if (!item) return new NextResponse('Not found', { status: 404 });

  const storage = new SupabaseStorageProvider(supabase);
  try {
    const { url } = await storage.createSignedAccess(item.storage_key, 60);
    return NextResponse.redirect(url);
  } catch {
    return new NextResponse('Not available', { status: 404 });
  }
}
