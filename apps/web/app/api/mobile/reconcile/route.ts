import { mobilePost } from '@/lib/mobile/route-helper';
import { supabaseMobileDb } from '@/lib/mobile/supabase-adapter';
import { reconcile } from '@/lib/mobile/handlers';

export const runtime = 'nodejs';

/** POST /api/mobile/reconcile — tombstone sources gone from the device (archive kept). */
export const POST = mobilePost(async (ctx, body) => {
  const db = supabaseMobileDb(ctx.supabase, ctx.userId);
  return reconcile(db, body);
});
