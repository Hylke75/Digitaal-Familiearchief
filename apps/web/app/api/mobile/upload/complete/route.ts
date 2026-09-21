import { mobilePost } from '@/lib/mobile/route-helper';
import { supabaseMobileDb, supabaseMobileStorage } from '@/lib/mobile/supabase-adapter';
import { completeUpload } from '@/lib/mobile/handlers';

export const runtime = 'nodejs';

/** POST /api/mobile/upload/complete — verify checksum, then archive via RPC. */
export const POST = mobilePost(async (ctx, body) => {
  const db = supabaseMobileDb(ctx.supabase, ctx.userId);
  const storage = supabaseMobileStorage(ctx.supabase);
  return completeUpload(db, storage, ctx.userId, body);
});
