import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';
import type { ArchiveStorageProvider } from '@dla/storage';
import { SupabaseStorageProvider } from '@/lib/archive/supabase-storage';

/**
 * The single composition point that picks the archive storage backend (§9).
 * Callers depend on the returned {@link ArchiveStorageProvider} interface, never
 * on a concrete class, so swapping Supabase Storage for another backend (S3, …)
 * is a one-line change here. Business logic in the domain packages already
 * depends only on the interface; this keeps the app layer consistent.
 */
export function createArchiveStorage(client: SupabaseClient<Database>): ArchiveStorageProvider {
  return new SupabaseStorageProvider(client);
}
