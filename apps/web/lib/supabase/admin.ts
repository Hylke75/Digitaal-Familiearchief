import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';
import { clientEnv } from '@/lib/env';

/**
 * Service-role Supabase client — SERVER-ONLY, privileged (bypasses RLS).
 * Used exclusively by the background worker and OAuth server routes, never in
 * user-facing code (CLAUDE.md §44). Throws if called in the browser or if the
 * service-role key is missing (fail safe — never silently degrade).
 */
export function createAdminClient(): SupabaseClient<Database> {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient() must not be used in the browser');
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createClient<Database>(clientEnv.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
