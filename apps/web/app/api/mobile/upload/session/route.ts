import { mobilePost } from '@/lib/mobile/route-helper';
import { supabaseMobileDb, supabaseMobileStorage } from '@/lib/mobile/supabase-adapter';
import { beginUploadSession } from '@/lib/mobile/handlers';

export const runtime = 'nodejs';

/** POST /api/mobile/upload/session — dedup check + signed resumable upload target. */
export const POST = mobilePost(async (ctx, body) => {
  const db = supabaseMobileDb(ctx.supabase, ctx.userId);
  const storage = supabaseMobileStorage(ctx.supabase);
  return beginUploadSession(db, storage, ctx.userId, body);
});
