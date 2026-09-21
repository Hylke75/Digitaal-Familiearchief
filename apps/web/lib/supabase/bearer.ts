import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';
import { clientEnv } from '@/lib/env';

export interface BearerContext {
  supabase: SupabaseClient<Database>;
  userId: string;
}

/**
 * Authenticate a request by its `Authorization: Bearer <token>` header and
 * return an RLS-scoped Supabase client + user id, or null when no valid token
 * is present.
 *
 * The native mobile app (docs/mobile/apple-photos.md) authenticates with a
 * Supabase access token, not browser cookies, so the cookie-based server client
 * cannot see it. The token is attached to every request this client makes, so
 * RLS policies and `auth.uid()` inside SECURITY DEFINER RPCs resolve to the
 * calling user. Uses only the public anon key — never the service role (§44).
 */
export async function bearerContext(request: Request): Promise<BearerContext | null> {
  const header = request.headers.get('authorization');
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return null;

  const supabase = createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { supabase, userId: data.user.id };
}
