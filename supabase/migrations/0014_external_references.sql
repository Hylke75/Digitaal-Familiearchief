-- ===========================================================================
-- 0014 — archive_external_references: link-only "media moment" memories
-- ---------------------------------------------------------------------------
-- Bewora lets a user attach a television/radio moment that is part of their
-- personal history (docs/connectors/beeld-en-geluid.md §6/§7). The audiovisual
-- media stays at Beeld & Geluid — Bewora stores ONLY the personal memory + an
-- official link (link-only by default). Nothing here copies or proxies
-- protected media, and no automated Schatkamer access happens (its terms forbid
-- scraping). The Schatkamer URL is validated SSRF-safe in the app before insert.
--
-- User-authored, so the owner gets full CRUD under RLS (same shape as
-- archive_albums). rights_status defaults to link_only; embedding is a separate,
-- owner-verified capability and is not enabled here.
-- ===========================================================================
create table if not exists public.archive_external_references (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'beeld_en_geluid',
  -- The official public Schatkamer/catalogue page (human link-out target).
  public_page_url text not null,
  title text not null,
  note text,
  -- Free-text broadcast date as the user remembers it (we do not resolve it
  -- from the catalogue in the link-only MVP).
  broadcast_note text,
  -- Personal fragment the memory refers to (seconds); display-only.
  fragment_start_seconds integer,
  fragment_end_seconds integer,
  rights_status text not null default 'link_only',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint archive_external_references_fragment_order
    check (
      fragment_start_seconds is null
      or fragment_end_seconds is null
      or fragment_end_seconds >= fragment_start_seconds
    )
);

create index if not exists archive_external_references_owner_idx
  on public.archive_external_references (owner_id, created_at desc);

create trigger archive_external_references_set_updated_at
  before update on public.archive_external_references
  for each row execute function public.set_updated_at();

alter table public.archive_external_references enable row level security;

create policy "archive_external_references_select_own" on public.archive_external_references
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "archive_external_references_insert_own" on public.archive_external_references
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "archive_external_references_update_own" on public.archive_external_references
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "archive_external_references_delete_own" on public.archive_external_references
  for delete to authenticated using ((select auth.uid()) = owner_id);
