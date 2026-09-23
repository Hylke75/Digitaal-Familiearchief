import { cache } from 'react';
import { createClient } from './server';

/**
 * The authenticated user for the current request, memoised with React's
 * `cache()`. A single page render fans out into a layout plus several data
 * loaders that each need the user; without this they'd each hit the Auth server.
 * `cache()` dedupes those into one round-trip per request (the result is never
 * shared across requests). Returns null when signed out.
 */
export const getCurrentUser = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
