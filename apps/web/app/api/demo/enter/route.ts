import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * One-click demo entry. Signs the visitor into the shared, seeded demo account
 * (credentials are server-only env, never exposed) and lands them in the app.
 * Writes are no-ops for this account (see lib/demo-account), so a shared session
 * is safe. If the demo isn't configured, fall back to the normal login.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) {
    return NextResponse.redirect(new URL('/inloggen', request.url));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.redirect(new URL('/inloggen?demo=unavailable', request.url));
  }
  return NextResponse.redirect(new URL('/vandaag', request.url));
}
