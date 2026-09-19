import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { clientEnv } from '@/lib/env';

/** Route prefixes that require an authenticated session (the app area). */
const PROTECTED_PREFIXES = [
  '/onboarding',
  '/importeren',
  '/vandaag',
  '/mijn-leven',
  '/fotos',
  '/videos',
  '/documenten',
  '/social',
  '/personen',
  '/plaatsen',
  '/bronnen',
  '/familie',
  '/instellingen',
  '/meer',
];

const AUTH_PAGES = ['/inloggen', '/registreren'];

/**
 * Refreshes the Supabase session on every request and enforces the auth
 * boundary (CLAUDE.md §13, §43): anonymous users are redirected away from the
 * app to /inloggen; signed-in users are kept out of the auth pages.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() revalidates the token; do not trust getSession() here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.includes(path);

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/inloggen';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/vandaag';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
