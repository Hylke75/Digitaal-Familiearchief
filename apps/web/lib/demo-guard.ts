import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';
import { isDemoUser } from '@/lib/demo-account';

/** True when the current session is the shared demo account — write server
 * actions call this and no-op so the demo stays pristine for everyone. */
export async function isDemoSession(supabase: SupabaseClient<Database>): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isDemoUser(user?.id);
}
