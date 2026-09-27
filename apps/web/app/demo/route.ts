import { NextResponse, type NextRequest } from 'next/server';
import { DEMO_COOKIE } from '@/lib/demo/mode';

/**
 * Enter (or leave) the file-backed demo. `/demo` opens the demo archive;
 * `/demo?exit=1` clears it. No credentials, no database — the demo reads only
 * the seeded JSON in /data/demo. Production data is never touched.
 */
export function GET(request: NextRequest) {
  const exit = request.nextUrl.searchParams.get('exit') === '1';
  const url = request.nextUrl.clone();
  url.search = '';
  url.pathname = exit ? '/inloggen' : '/vandaag';
  const res = NextResponse.redirect(url);
  if (exit) {
    res.cookies.set(DEMO_COOKIE, '', { path: '/', maxAge: 0 });
  } else {
    res.cookies.set(DEMO_COOKIE, '1', {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: false,
    });
  }
  return res;
}
