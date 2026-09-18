/**
 * @dla/database — generated database types and typed helpers.
 *
 * Phase 0 ships a placeholder `Database` type. In Phase 1, after the initial
 * migrations exist, this file is REPLACED by types generated from the live
 * schema (`supabase gen types typescript`) so the app and packages get
 * end-to-end type safety against the real tables.
 *
 * This package intentionally contains NO Supabase client construction: cookie-
 * and request-bound client creation is Next.js-specific and lives in
 * apps/web/lib/supabase to keep the service-role boundary explicit (§44).
 */

// Placeholder shape compatible with @supabase/supabase-js generics.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
