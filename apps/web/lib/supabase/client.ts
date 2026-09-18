import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@dla/database';
import { clientEnv } from '@/lib/env';

/**
 * Browser Supabase client. Uses only the public anon/publishable key; RLS
 * (default deny — CLAUDE.md §43) is the security boundary, never frontend
 * filtering. The service-role key is never available here (§44).
 */
export function createClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
