import { z } from 'zod';

/**
 * Environment validation (CLAUDE.md §12). The app fails fast and clearly if
 * required configuration is missing. The service-role key is validated in a
 * SEPARATE, server-only schema so it can never be pulled into a client bundle
 * (CLAUDE.md §44).
 */

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({ message: 'NEXT_PUBLIC_SUPABASE_URL must be a URL' }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default('nl-NL'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
});

/** Public config — safe for the browser. Reads only NEXT_PUBLIC_* variables. */
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  TOKEN_ENCRYPTION_KEY: z.string().optional(),
});

/**
 * Server-only config. Never import this from a Client Component. The values are
 * read lazily so the browser bundle never references the service-role key.
 */
export function getServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() must not be called in the browser');
  }
  return serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
  });
}
