/**
 * @dla/database — database types generated from the live Supabase schema.
 *
 * Regenerate after every migration with:
 *   supabase gen types typescript --project-id <ref> > packages/database/src/types.gen.ts
 *
 * This package intentionally contains NO Supabase client construction: cookie-
 * and request-bound client creation is Next.js-specific and lives in
 * apps/web/lib/supabase to keep the service-role boundary explicit (§44).
 */
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from './types.gen';
export { Constants } from './types.gen';
