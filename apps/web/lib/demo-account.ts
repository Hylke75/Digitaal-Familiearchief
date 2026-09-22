/**
 * Shared read-only demo account (opt-in via env). One seeded Supabase user with
 * synthetic content showcases the real app — timeline, albums, people, places,
 * search, thumbnails — so a visitor can experience everything without anyone
 * sharing real files. Writes are turned into no-ops for the demo user so the
 * shared account stays pristine for the next visitor (the UI still reacts
 * optimistically). Nothing here exposes credentials; the id is public.
 */

/** The seeded demo user's id, or null when the demo isn't configured. */
export function demoUserId(): string | null {
  const id = process.env.NEXT_PUBLIC_DEMO_USER_ID?.trim();
  return id ? id : null;
}

/** Whether a "Probeer de demo" entry point should be shown. */
export function demoEnabled(): boolean {
  return demoUserId() !== null;
}

/** True when the given user is the shared demo account (writes must no-op). */
export function isDemoUser(userId: string | null | undefined): boolean {
  const id = demoUserId();
  return Boolean(id && userId && userId === id);
}
