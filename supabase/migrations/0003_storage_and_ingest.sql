-- =============================================================================
-- Storage bucket + ingest RPC (CLAUDE.md Phase 4/5 support)
-- A private bucket holds archived originals; storage RLS scopes objects to the
-- owner's folder. The SECURITY DEFINER ingest RPC is the ONLY way authenticated
-- users write archive_items/sources — it validates ownership and dedups on
-- checksum, so users cannot fabricate arbitrary archive rows (§44 intent) while
-- avoiding the need for a service-role key in the app.
-- =============================================================================

-- Private bucket for originals.
insert into storage.buckets (id, name, public)
values ('archief', 'archief', false)
on conflict (id) do nothing;

-- Storage RLS: an authenticated user may only touch objects under their own
-- uid folder. Object key layout: archive/<uid>/<xx>/<sha256>.
create policy "archief_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'archief' and (storage.foldername(name))[2] = (select auth.uid())::text
  );
create policy "archief_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'archief' and (storage.foldername(name))[2] = (select auth.uid())::text
  );
create policy "archief_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'archief' and (storage.foldername(name))[2] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'archief' and (storage.foldername(name))[2] = (select auth.uid())::text
  );
create policy "archief_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'archief' and (storage.foldername(name))[2] = (select auth.uid())::text
  );

-- Prevent duplicate source rows on idempotent re-import.
alter table public.archive_item_sources
  add constraint archive_item_sources_unique_source
  unique (archive_item_id, connector_account_id, source_item_id);

-- ---------------------------------------------------------------------------
-- Ingest RPC — the vetted write path for the archive engine.
-- ---------------------------------------------------------------------------
create or replace function public.archive_ingest_item(
  p_connector_account_id uuid,
  p_type archive_item_type,
  p_original_filename text,
  p_mime_type text,
  p_file_size bigint,
  p_checksum_sha256 text,
  p_storage_provider text,
  p_storage_key text,
  p_source_item_id text,
  p_created_at_source timestamptz default null,
  p_modified_at_source timestamptz default null,
  p_source_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_item_id uuid;
  v_deduped boolean := false;
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

  -- Insert the item; on checksum conflict it already exists (dedup).
  insert into public.archive_items (
    owner_id, type, original_filename, mime_type, file_size, checksum_sha256,
    created_at_source, modified_at_source, archived_at, storage_provider,
    storage_key, status
  )
  values (
    v_owner, p_type, p_original_filename, p_mime_type, p_file_size, p_checksum_sha256,
    p_created_at_source, p_modified_at_source, now(), p_storage_provider,
    p_storage_key, 'archived'
  )
  on conflict (owner_id, checksum_sha256) do nothing
  returning id into v_item_id;

  if v_item_id is null then
    v_deduped := true;
    select id into v_item_id
    from public.archive_items
    where owner_id = v_owner and checksum_sha256 = p_checksum_sha256;
  end if;

  -- Record the source relationship (idempotent).
  insert into public.archive_item_sources (
    archive_item_id, connector_account_id, source_item_id, source_url_if_safe,
    source_created_at, source_modified_at
  )
  values (
    v_item_id, p_connector_account_id, p_source_item_id, p_source_url,
    p_created_at_source, p_modified_at_source
  )
  on conflict (archive_item_id, connector_account_id, source_item_id) do nothing;

  update public.connector_accounts
    set last_successful_archive_at = now(), status = 'connected'
    where id = p_connector_account_id;

  return jsonb_build_object('deduped', v_deduped, 'item_id', v_item_id);
end;
$$;

revoke all on function public.archive_ingest_item(
  uuid, archive_item_type, text, text, bigint, text, text, text, text, timestamptz, timestamptz, text
) from public, anon;
grant execute on function public.archive_ingest_item(
  uuid, archive_item_type, text, text, bigint, text, text, text, text, timestamptz, timestamptz, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Summary RPC — counts per archive item type for the current user.
-- Runs as INVOKER so RLS naturally restricts it to the caller's rows.
-- ---------------------------------------------------------------------------
create or replace function public.archive_summary()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_object_agg(t, n), '{}'::jsonb)
  from (
    select type::text as t, count(*) as n
    from public.archive_items
    where owner_id = (select auth.uid())
    group by type
  ) s;
$$;

revoke all on function public.archive_summary() from public, anon;
grant execute on function public.archive_summary() to authenticated;
