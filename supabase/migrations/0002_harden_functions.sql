-- Harden helper functions (addresses Supabase security advisors):
-- pin search_path on the updated_at trigger helper, and revoke direct EXECUTE
-- on trigger functions from API roles — they are only ever invoked by triggers,
-- never as PostgREST RPCs.
alter function public.set_updated_at() set search_path = '';

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
