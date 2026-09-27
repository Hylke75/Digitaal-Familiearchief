import { cookies } from 'next/headers';

/**
 * Demo mode is a safe, development/showcase session backed entirely by the
 * seeded JSON in /data/demo — no Supabase user, no database writes, production
 * data untouched. It is enabled by the `bewora_demo` cookie, set at /demo.
 */
export const DEMO_COOKIE = 'bewora_demo';

export function isDemo(): boolean {
  return cookies().get(DEMO_COOKIE)?.value === '1';
}

/** Dev-only display identity for the demo archive. Never a real credential. */
export const DEMO_USER = {
  name: 'Demo',
  fullName: 'Demo-archief',
};
