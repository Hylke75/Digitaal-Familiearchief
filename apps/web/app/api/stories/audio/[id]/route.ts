import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signStoryAudio } from '@/lib/archive/stories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A fresh signed URL for one story's audio, so the player can recover from an
 * expired link (same pattern as the thumbnail refresh). RLS restricts the
 * lookup to the owner.
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ url: null }, { status: 401 });
  const url = await signStoryAudio(supabase, params.id);
  return NextResponse.json({ url }, { headers: { 'cache-control': 'no-store' } });
}
