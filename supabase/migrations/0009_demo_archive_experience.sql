-- ===========================================================================
-- 0009 — Demo/archive experience model (AUTHORED, NOT YET APPLIED)
-- ---------------------------------------------------------------------------
-- The demo is delivered in file-backed mode (docs/DEMO_ARCHIVE.md): the app
-- reads seeded JSON from /data/demo and no row is written to the production
-- database. This migration is the schema for the *optional* future path where
-- the demo (and these experience features) live in a dedicated Supabase
-- project. It is intentionally left UNAPPLIED — apply it only against a
-- non-production project, with an explicit decision (CLAUDE.md §56, §64).
--
-- It is purely additive and reuses the 0008 foundation (albums/people/places/
-- flags). Every new table: RLS default-deny, owner-scoped. No existing data is
-- mutated. Originals stay immutable (§32).
-- ===========================================================================

-- 1. Honest dates & locations on the canonical item (§19, §21) -------------
do $$ begin
  create type public.date_precision as enum
    ('exact_time', 'date', 'month', 'year', 'approximate', 'unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.location_source as enum
    ('exif', 'provider', 'user', 'inferred', 'unknown');
exception when duplicate_object then null; end $$;

alter table public.archive_items
  add column if not exists date_precision  public.date_precision not null default 'exact_time',
  add column if not exists taken_at_override timestamptz,        -- user override (§50)
  add column if not exists location_source public.location_source not null default 'unknown',
  add column if not exists place_label     text,
  add column if not exists place_label_override text,            -- user override (§50)
  add column if not exists city            text,
  add column if not exists country         text,
  add column if not exists region          text,                -- places bucket
  add column if not exists is_demo         boolean not null default false;

create index if not exists archive_items_owner_region_idx
  on public.archive_items (owner_id, region);
create index if not exists archive_items_demo_idx
  on public.archive_items (owner_id) where is_demo;

-- 2. is_demo markers on user-authored tables (§43 safe reset target) --------
alter table public.archive_albums add column if not exists is_demo boolean not null default false;
alter table public.archive_people add column if not exists is_demo boolean not null default false;
alter table public.archive_places add column if not exists is_demo boolean not null default false;

-- 3. Item relationships — duplicates / compressed versions (§8, §22, §48) ---
--    The canonical binary is deduped in archive_items; a relationship records
--    that another asset is a *version* of it (e.g. a WhatsApp-compressed copy)
--    without showing a second gallery tile.
do $$ begin
  create type public.asset_relationship as enum
    ('duplicate', 'whatsapp_compressed_version', 'social_export_version', 'edited_version');
exception when duplicate_object then null; end $$;

create table if not exists public.archive_item_relationships (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  primary_item_id uuid not null references public.archive_items (id) on delete cascade,
  related_item_id uuid references public.archive_items (id) on delete cascade,
  relationship public.asset_relationship not null,
  note text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (primary_item_id, related_item_id, relationship)
);
create index if not exists archive_item_relationships_primary_idx
  on public.archive_item_relationships (primary_item_id);

-- 4. Source folders (§13, §35) — provider structure, separate from albums ----
create table if not exists public.archive_source_folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  connector_account_id uuid references public.connector_accounts (id) on delete set null,
  source_key text not null,           -- e.g. google_drive
  path text not null,                 -- e.g. Mijn Drive/Privé/Huis/Hypotheek
  label text not null,                -- leaf name
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (owner_id, source_key, path)
);
create index if not exists archive_source_folders_owner_idx
  on public.archive_source_folders (owner_id, source_key);

-- A document's original folder is metadata on the source relationship; add a
-- normalised column so folder views can query it directly.
alter table public.archive_item_sources
  add column if not exists source_folder_path text,
  add column if not exists document_category text;

-- 5. My Life — memories and their links (§15, §36 My Life, §37) -------------
create table if not exists public.archive_memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  story text,
  happened_at timestamptz,
  date_precision public.date_precision not null default 'date',
  place_label text,
  -- External archive reference (§16) — e.g. Beeld & Geluid. Never a fabricated
  -- real URL; status carries DEMO for demonstration references.
  external_provider text,
  external_programme text,
  external_date text,
  external_fragment_start text,
  external_fragment_end text,
  external_status text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists archive_memories_owner_idx on public.archive_memories (owner_id);
create trigger archive_memories_set_updated_at
  before update on public.archive_memories
  for each row execute function public.set_updated_at();

create table if not exists public.archive_memory_items (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.archive_memories (id) on delete cascade,
  archive_item_id uuid not null references public.archive_items (id) on delete cascade,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  unique (memory_id, archive_item_id)
);
create index if not exists archive_memory_items_memory_idx
  on public.archive_memory_items (memory_id, position);

-- 6. Smart albums — dynamic rule stored as jsonb (§11) ----------------------
create table if not exists public.archive_smart_albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  rule jsonb not null default '{}'::jsonb,   -- {source, year, placeContains, favorite, beforeYear}
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists archive_smart_albums_owner_idx on public.archive_smart_albums (owner_id);
create trigger archive_smart_albums_set_updated_at
  before update on public.archive_smart_albums
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- RLS — enable + owner-scoped policies (default deny; §43)
-- ===========================================================================
alter table public.archive_item_relationships enable row level security;
alter table public.archive_source_folders     enable row level security;
alter table public.archive_memories           enable row level security;
alter table public.archive_memory_items       enable row level security;
alter table public.archive_smart_albums       enable row level security;

create policy "air_select_own" on public.archive_item_relationships
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "air_insert_own" on public.archive_item_relationships
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "air_delete_own" on public.archive_item_relationships
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "asf_select_own" on public.archive_source_folders
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "asf_insert_own" on public.archive_source_folders
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "asf_update_own" on public.archive_source_folders
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "asf_delete_own" on public.archive_source_folders
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "mem_select_own" on public.archive_memories
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "mem_insert_own" on public.archive_memories
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "mem_update_own" on public.archive_memories
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "mem_delete_own" on public.archive_memories
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- memory_items: manage only when the parent memory and item are both yours.
create policy "memitem_select_own" on public.archive_memory_items
  for select to authenticated using (
    exists (select 1 from public.archive_memories m
            where m.id = archive_memory_items.memory_id and m.owner_id = (select auth.uid()))
  );
create policy "memitem_insert_own" on public.archive_memory_items
  for insert to authenticated with check (
    exists (select 1 from public.archive_memories m
            where m.id = archive_memory_items.memory_id and m.owner_id = (select auth.uid()))
    and exists (select 1 from public.archive_items ai
            where ai.id = archive_memory_items.archive_item_id and ai.owner_id = (select auth.uid()))
  );
create policy "memitem_delete_own" on public.archive_memory_items
  for delete to authenticated using (
    exists (select 1 from public.archive_memories m
            where m.id = archive_memory_items.memory_id and m.owner_id = (select auth.uid()))
  );

create policy "smart_select_own" on public.archive_smart_albums
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "smart_insert_own" on public.archive_smart_albums
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "smart_update_own" on public.archive_smart_albums
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "smart_delete_own" on public.archive_smart_albums
  for delete to authenticated using ((select auth.uid()) = owner_id);
