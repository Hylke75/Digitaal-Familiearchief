import { mobilePost } from '@/lib/mobile/route-helper';
import { supabaseMobileDb } from '@/lib/mobile/supabase-adapter';
import { registerDevice } from '@/lib/mobile/handlers';

// Node runtime: archive/crypto helpers depend on node:crypto.
export const runtime = 'nodejs';

/** POST /api/mobile/device — register/refresh an iOS device (apple_photos). */
export const POST = mobilePost(async (ctx, body) => {
  const db = supabaseMobileDb(ctx.supabase, ctx.userId);
  return registerDevice(db, body);
});
