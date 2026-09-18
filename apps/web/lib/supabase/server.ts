import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@dla/database';
import { clientEnv } from '@/lib/env';

/**
 * Server Supabase client for Server Components, Route Handlers and Server
 * Actions. Bound to the request's cookies so the user's session (and therefore
 * their RLS context) is respected. Still uses the anon key — privileged,
 * service-role operations get a separate, explicitly server-only client added
 * in a later phase (§44).
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `setAll` is called from a Server Component where mutating cookies
            // is not allowed. Safe to ignore when middleware refreshes sessions.
          }
        },
      },
    },
  );
}
