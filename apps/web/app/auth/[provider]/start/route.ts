import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { generatePkce, randomToken } from '@dla/security';
import { buildAuthorizeUrl } from '@dla/oauth';
import { createClient } from '@/lib/supabase/server';
import { getLiveProvider } from '@/lib/connectors/live-providers';

export const OAUTH_COOKIE = 'bewora_oauth';

/** Begin an OAuth connect flow: set a short-lived httpOnly state+PKCE cookie and
 * redirect to the provider (docs/connectors/ARCHITECTURE.md §2). */
export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const provider = params.provider;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/inloggen', request.url));

  const lp = getLiveProvider(provider);
  if (!lp)
    return NextResponse.redirect(new URL('/bronnen?verbinden=niet-beschikbaar', request.url));

  const state = randomToken();
  const pkce = generatePkce();

  cookies().set(
    OAUTH_COOKIE,
    JSON.stringify({ provider, state, codeVerifier: pkce.codeVerifier }),
    {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    },
  );

  const url = buildAuthorizeUrl(lp.oauth, lp.makeClient(), {
    state,
    codeChallenge: pkce.codeChallenge,
  });
  return NextResponse.redirect(url);
}
