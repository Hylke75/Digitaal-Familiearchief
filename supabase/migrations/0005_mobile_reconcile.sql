-- =============================================================================
-- Mobile device reconcile RPC (CLAUDE.md §4, §22 — "outage != deletion").
-- The native iOS app (docs/mobile/apple-photos.md) periodically reports which
-- assets are still present on the device. Assets that disappeared get their
-- source relationship tombstoned (source_deleted_at), but the ARCHIVED COPY IS
-- NEVER DELETED. archive_item_sources has no authenticated write policy (writes
-- go through vetted SECURITY DEFINER functions only), so reconciliation needs a
-- definer RPC that validates the caller owns the connector account.
-- =============================================================================

create or replace function public.archive_reconcile_sources(
  p_connector_account_id uuid,
  p_present_source_item_ids text[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_count integer := 0;
begin
  if v_owner is null then
    raise exception 'not authenticated';
  end if;

  -- The connector account must belong to the caller.
  if not exists (
    select 1 from public.connector_accounts
    where id = p_connector_account_id and user_id = v_owner
  ) then
    raise exception 'connector account not found for user';
  end if;

  -- Tombstone sources for this account whose source_item_id is no longer present
  -- on the device. The archive_items rows themselves are left untouched (§4).
  -- An empty "present" array means the device reports nothing present, which
  -- legitimately marks every still-live source for this account as gone.
  with updated as (
    update public.archive_item_sources s
      set source_deleted_at = now()
    from public.archive_items ai
    where s.archive_item_id = ai.id
      and ai.owner_id = v_owner
      and s.connector_account_id = p_connector_account_id
      and s.source_deleted_at is null
      and s.source_item_id is not null
      and not (s.source_item_id = any (p_present_source_item_ids))
    returning s.id
  )
  select count(*) into v_count from updated;

  return v_count;
end;
$$;

revoke all on function public.archive_reconcile_sources(uuid, text[]) from public, anon;
grant execute on function public.archive_reconcile_sources(uuid, text[]) to authenticated;
