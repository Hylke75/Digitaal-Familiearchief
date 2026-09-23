-- ===========================================================================
-- 0010 — archive_update_item: owner-scoped corrections
-- ---------------------------------------------------------------------------
-- Lets a user correct their own memory without a service role: the capture
-- date (a scanned 1974 photo carries its scan date, §Permanent) and the title,
-- plus a shallow merge into metadata_json (document fields: sender, type,
-- document date, labels, expiry). archive_items has no UPDATE policy for
-- `authenticated` on purpose (writes go through vetted functions), so this
-- SECURITY DEFINER function is the single, minimal write path. It only ever
-- touches the caller's own row and never the immutable storage/checksum.
-- ===========================================================================
create or replace function public.archive_update_item(
  p_id uuid,
  p_taken_at timestamptz default null,
  p_original_filename text default null,
  p_metadata jsonb default null,
  p_clear_taken_at boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
begin
  if v_owner is null then
    raise exception 'not authenticated';
  end if;

  update public.archive_items
    set
      taken_at = case
        when p_clear_taken_at then null
        when p_taken_at is not null then p_taken_at
        else taken_at
      end,
      original_filename = coalesce(nullif(btrim(p_original_filename), ''), original_filename),
      metadata_json = case
        when p_metadata is not null then metadata_json || p_metadata
        else metadata_json
      end,
      updated_at = now()
  where id = p_id and owner_id = v_owner;
end;
$$;

revoke all on function public.archive_update_item(uuid, timestamptz, text, jsonb, boolean)
  from public, anon;
grant execute on function public.archive_update_item(uuid, timestamptz, text, jsonb, boolean)
  to authenticated;
