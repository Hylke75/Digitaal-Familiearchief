-- ===========================================================================
-- 0011 — archive_register_derivative: owner-scoped preview registration
-- ---------------------------------------------------------------------------
-- Documents (PDFs) are not renderable by the on-the-fly image transform, so a
-- first-page preview has to be pre-rendered and stored as a derivative
-- (docs/DESIGN.md §Documenten). archive_derivatives is system-written (only a
-- SELECT-own policy exists) because the cron worker uses the service role. The
-- demo seed, however, runs as the owner with the anon key + RLS and has no
-- service role, so it needs a vetted write path to register a preview it just
-- uploaded to its own storage folder.
--
-- This SECURITY DEFINER function is that path: it upserts one derivative row,
-- but ONLY for an item the caller owns, and never touches anything else. The
-- storage blob itself is written by the owner under archive/<owner_id>/… where
-- storage RLS already lets the owner read and write. Idempotent on
-- (archive_item_id, kind), so a re-run overwrites rather than duplicates.
-- ===========================================================================
create or replace function public.archive_register_derivative(
  p_item_id uuid,
  p_kind text,
  p_storage_key text,
  p_mime_type text,
  p_width integer default null,
  p_height integer default null,
  p_byte_size bigint default 0
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
  if p_kind not in ('thumb', 'preview', 'poster') then
    raise exception 'invalid derivative kind: %', p_kind;
  end if;

  -- Only the item's owner may register a derivative for it.
  if not exists (
    select 1 from public.archive_items
    where id = p_item_id and owner_id = v_owner
  ) then
    raise exception 'item not found or not owned';
  end if;

  insert into public.archive_derivatives
    (archive_item_id, owner_id, kind, storage_key, mime_type, width, height, byte_size)
  values
    (p_item_id, v_owner, p_kind, p_storage_key, p_mime_type, p_width, p_height, coalesce(p_byte_size, 0))
  on conflict (archive_item_id, kind) do update
    set storage_key = excluded.storage_key,
        mime_type = excluded.mime_type,
        width = excluded.width,
        height = excluded.height,
        byte_size = excluded.byte_size;
end;
$$;

revoke all on function public.archive_register_derivative(uuid, text, text, text, integer, integer, bigint)
  from public, anon;
grant execute on function public.archive_register_derivative(uuid, text, text, text, integer, integer, bigint)
  to authenticated;
