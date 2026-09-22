-- ===========================================================================
-- 0008 — Archive Experience canonical data model
-- ---------------------------------------------------------------------------
-- Additive foundation for the browsing/reliving experience (docs/
-- ARCHIVE_EXPERIENCE_AUDIT.md §8). Never mutates the immutable original (§32).
-- Every new table: RLS default-deny, owner-scoped (§43). System-written tables
-- expose SELECT-own only; user-authored tables (albums/people/places/flags) get
-- full owner-scoped CRUD. All timestamps timestamptz.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Capture-metadata retention on archive_items.
--    metadata_json was never populated; add a normalised, indexable subset so
--    timeline/places can be built. Populated by archive_ingest_item below.
-- ---------------------------------------------------------------------------
alter table public.archive_items
  add column if not exists taken_at    timestamptz,
  add column if not exists latitude    double precision,
  add column if not exists longitude   double precision,
  add column if not exists width       integer,
  add column if not exists height      integer,
  add column if not exists duration_ms integer,
  add column if not exists camera      text;

-- Timeline ordering: prefer the real capture time, fall back to source/archive.
create index if not exists archive_items_owner_timeline_idx
  on public.archive_items (owner_id, (coalesce(taken_at, created_at_source, archived_at)) desc);

-- Places: only rows that actually carry coordinates.
create index if not exists archive_items_owner_geo_idx
  on public.archive_items (owner_id, latitude, longitude)
  where latitude is not null and longitude is not null;

-- ---------------------------------------------------------------------------
-- 2. archive_ingest_item — now retains metadata_json + derives the normalised
--    columns defensively (bad/absent values simply stay null). Backward
--    compatible: p_metadata is optional and trailing, existing callers are
--    unaffected. First-write-wins on dedup (original preserved, §4/§23).
-- ---------------------------------------------------------------------------
-- Drop the prior 12-arg signature so adding a trailing param REPLACES rather
-- than creating a second overload (single canonical function).
drop function if exists public.archive_ingest_item(
  uuid, archive_item_type, text, text, bigint, text, text, text, text,
  timestamptz, timestamptz, text
);

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
  p_source_url text default null,
  p_metadata jsonb default '{}'::jsonb
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
  v_meta jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_taken timestamptz;
  v_lat double precision;
  v_lon double precision;
  v_width integer;
  v_height integer;
  v_duration integer;
  v_camera text;
begin
  if v_owner is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from public.connector_accounts
    where id = p_connector_account_id and user_id = v_owner
  ) then
    raise exception 'connector account not found for user';
  end if;

  -- Defensive extraction of the normalised, queryable metadata subset.
  begin
    v_taken := nullif(v_meta->>'takenAt', '')::timestamptz;
  exception when others then
    v_taken := null;
  end;
  v_lat := case when jsonb_typeof(v_meta->'latitude') = 'number'
                then (v_meta->>'latitude')::double precision end;
  v_lon := case when jsonb_typeof(v_meta->'longitude') = 'number'
                then (v_meta->>'longitude')::double precision end;
  v_width := case when jsonb_typeof(v_meta->'width') = 'number'
                  then (v_meta->>'width')::integer end;
  v_height := case when jsonb_typeof(v_meta->'height') = 'number'
                   then (v_meta->>'height')::integer end;
  v_duration := case when jsonb_typeof(v_meta->'durationMs') = 'number'
                     then (v_meta->>'durationMs')::integer end;
  v_camera := nullif(v_meta->>'camera', '');

  insert into public.archive_items (
    owner_id, type, original_filename, mime_type, file_size, checksum_sha256,
    created_at_source, modified_at_source, archived_at, storage_provider,
    storage_key, status, metadata_json,
    taken_at, latitude, longitude, width, height, duration_ms, camera
  )
  values (
    v_owner, p_type, p_original_filename, p_mime_type, p_file_size, p_checksum_sha256,
    p_created_at_source, p_modified_at_source, now(), p_storage_provider,
    p_storage_key, 'archived', v_meta,
    v_taken, v_lat, v_lon, v_width, v_height, v_duration, v_camera
  )
  on conflict (owner_id, checksum_sha256) do nothing
  returning id into v_item_id;

  if v_item_id is null then
    v_deduped := true;
    select id into v_item_id
    from public.archive_items
    where owner_id = v_owner and checksum_sha256 = p_checksum_sha256;
  end if;

  insert into public.archive_item_sources (
    archive_item_id, connector_account_id, source_item_id, source_url_if_safe,
    source_created_at, source_modified_at, metadata_json
  )
  values (
    v_item_id, p_connector_account_id, p_source_item_id, p_source_url,
    p_created_at_source, p_modified_at_source, v_meta
  )
  on conflict (archive_item_id, connector_account_id, source_item_id) do nothing;

  update public.connector_accounts
    set last_successful_archive_at = now(), status = 'connected'
    where id = p_connector_account_id;

  return jsonb_build_object('deduped', v_deduped, 'item_id', v_item_id);
end;
$$;

-- Preserve the original least-privilege grants (§44).
revoke all on function public.archive_ingest_item(
  uuid, archive_item_type, text, text, bigint, text, text, text, text,
  timestamptz, timestamptz, text, jsonb
) from public, anon;
grant execute on function public.archive_ingest_item(
  uuid, archive_item_type, text, text, bigint, text, text, text, text,
  timestamptz, timestamptz, text, jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. archive_derivatives — persisted thumbnails/previews/posters so HEIC and
--    video get server-generated previews (system-written; SELECT-own).
-- ---------------------------------------------------------------------------
create table if not exists public.archive_derivatives (
  id uuid primary key default gen_random_uuid(),
  archive_item_id uuid not null references public.archive_items (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('thumb', 'preview', 'poster')),
  storage_key text not null,
  mime_type text not null,
  width integer,
  height integer,
  byte_size bigint not null default 0,
  created_at timestamptz not null default now(),
  unique (archive_item_id, kind)
);
create index if not exists archive_derivatives_item_idx
  on public.archive_derivatives (archive_item_id);
create index if not exists archive_derivatives_owner_idx
  on public.archive_derivatives (owner_id);

-- ---------------------------------------------------------------------------
-- 4. archive_albums (+ items) — user collections. User-authored: full CRUD own.
-- ---------------------------------------------------------------------------
create table if not exists public.archive_albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  cover_item_id uuid references public.archive_items (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists archive_albums_owner_idx on public.archive_albums (owner_id);
create trigger archive_albums_set_updated_at
  before update on public.archive_albums
  for each row execute function public.set_updated_at();

create table if not exists public.archive_album_items (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.archive_albums (id) on delete cascade,
  archive_item_id uuid not null references public.archive_items (id) on delete cascade,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  unique (album_id, archive_item_id)
);
create index if not exists archive_album_items_album_idx
  on public.archive_album_items (album_id, position);
create index if not exists archive_album_items_item_idx
  on public.archive_album_items (archive_item_id);

-- ---------------------------------------------------------------------------
-- 5. archive_people (+ item links) — a person is NOT an app user (§37).
--    Manual tagging only; face recognition is out of scope (§59, §62).
-- ---------------------------------------------------------------------------
create table if not exists public.archive_people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  cover_item_id uuid references public.archive_items (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists archive_people_owner_idx on public.archive_people (owner_id);
create trigger archive_people_set_updated_at
  before update on public.archive_people
  for each row execute function public.set_updated_at();

create table if not exists public.archive_item_people (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.archive_people (id) on delete cascade,
  archive_item_id uuid not null references public.archive_items (id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (person_id, archive_item_id)
);
create index if not exists archive_item_people_person_idx
  on public.archive_item_people (person_id);
create index if not exists archive_item_people_item_idx
  on public.archive_item_people (archive_item_id);

-- ---------------------------------------------------------------------------
-- 6. archive_places (+ item links) — named places (manual or derived from geo).
-- ---------------------------------------------------------------------------
create table if not exists public.archive_places (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists archive_places_owner_idx on public.archive_places (owner_id);
create trigger archive_places_set_updated_at
  before update on public.archive_places
  for each row execute function public.set_updated_at();

create table if not exists public.archive_item_places (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.archive_places (id) on delete cascade,
  archive_item_id uuid not null references public.archive_items (id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (place_id, archive_item_id)
);
create index if not exists archive_item_places_place_idx
  on public.archive_item_places (place_id);
create index if not exists archive_item_places_item_idx
  on public.archive_item_places (archive_item_id);

-- ---------------------------------------------------------------------------
-- 7. archive_item_flags — per-owner mutable state (favourite/hidden), kept off
--    the immutable item. One row per (owner, item). User-authored: full CRUD.
-- ---------------------------------------------------------------------------
create table if not exists public.archive_item_flags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  archive_item_id uuid not null references public.archive_items (id) on delete cascade,
  favourite boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, archive_item_id)
);
create index if not exists archive_item_flags_favourite_idx
  on public.archive_item_flags (owner_id) where favourite;
create index if not exists archive_item_flags_item_idx
  on public.archive_item_flags (archive_item_id);
create trigger archive_item_flags_set_updated_at
  before update on public.archive_item_flags
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- RLS — enable + policies (default deny; §43).
-- ===========================================================================
alter table public.archive_derivatives  enable row level security;
alter table public.archive_albums        enable row level security;
alter table public.archive_album_items   enable row level security;
alter table public.archive_people        enable row level security;
alter table public.archive_item_people   enable row level security;
alter table public.archive_places        enable row level security;
alter table public.archive_item_places   enable row level security;
alter table public.archive_item_flags    enable row level security;

-- derivatives: system-written; owner reads only.
create policy "archive_derivatives_select_own" on public.archive_derivatives
  for select to authenticated using ((select auth.uid()) = owner_id);

-- albums: full owner CRUD.
create policy "archive_albums_select_own" on public.archive_albums
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "archive_albums_insert_own" on public.archive_albums
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "archive_albums_update_own" on public.archive_albums
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "archive_albums_delete_own" on public.archive_albums
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- album_items: manage when the parent album AND the item both belong to you.
create policy "archive_album_items_select_own" on public.archive_album_items
  for select to authenticated using (
    exists (select 1 from public.archive_albums a
            where a.id = archive_album_items.album_id and a.owner_id = (select auth.uid()))
  );
create policy "archive_album_items_insert_own" on public.archive_album_items
  for insert to authenticated with check (
    exists (select 1 from public.archive_albums a
            where a.id = archive_album_items.album_id and a.owner_id = (select auth.uid()))
    and exists (select 1 from public.archive_items ai
            where ai.id = archive_album_items.archive_item_id and ai.owner_id = (select auth.uid()))
  );
create policy "archive_album_items_delete_own" on public.archive_album_items
  for delete to authenticated using (
    exists (select 1 from public.archive_albums a
            where a.id = archive_album_items.album_id and a.owner_id = (select auth.uid()))
  );

-- people: full owner CRUD.
create policy "archive_people_select_own" on public.archive_people
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "archive_people_insert_own" on public.archive_people
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "archive_people_update_own" on public.archive_people
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "archive_people_delete_own" on public.archive_people
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "archive_item_people_select_own" on public.archive_item_people
  for select to authenticated using (
    exists (select 1 from public.archive_people p
            where p.id = archive_item_people.person_id and p.owner_id = (select auth.uid()))
  );
create policy "archive_item_people_insert_own" on public.archive_item_people
  for insert to authenticated with check (
    exists (select 1 from public.archive_people p
            where p.id = archive_item_people.person_id and p.owner_id = (select auth.uid()))
    and exists (select 1 from public.archive_items ai
            where ai.id = archive_item_people.archive_item_id and ai.owner_id = (select auth.uid()))
  );
create policy "archive_item_people_delete_own" on public.archive_item_people
  for delete to authenticated using (
    exists (select 1 from public.archive_people p
            where p.id = archive_item_people.person_id and p.owner_id = (select auth.uid()))
  );

-- places: full owner CRUD.
create policy "archive_places_select_own" on public.archive_places
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "archive_places_insert_own" on public.archive_places
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "archive_places_update_own" on public.archive_places
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "archive_places_delete_own" on public.archive_places
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "archive_item_places_select_own" on public.archive_item_places
  for select to authenticated using (
    exists (select 1 from public.archive_places p
            where p.id = archive_item_places.place_id and p.owner_id = (select auth.uid()))
  );
create policy "archive_item_places_insert_own" on public.archive_item_places
  for insert to authenticated with check (
    exists (select 1 from public.archive_places p
            where p.id = archive_item_places.place_id and p.owner_id = (select auth.uid()))
    and exists (select 1 from public.archive_items ai
            where ai.id = archive_item_places.archive_item_id and ai.owner_id = (select auth.uid()))
  );
create policy "archive_item_places_delete_own" on public.archive_item_places
  for delete to authenticated using (
    exists (select 1 from public.archive_places p
            where p.id = archive_item_places.place_id and p.owner_id = (select auth.uid()))
  );

-- item flags: full owner CRUD (upsert favourite/hidden).
create policy "archive_item_flags_select_own" on public.archive_item_flags
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "archive_item_flags_insert_own" on public.archive_item_flags
  for insert to authenticated with check (
    (select auth.uid()) = owner_id
    and exists (select 1 from public.archive_items ai
            where ai.id = archive_item_flags.archive_item_id and ai.owner_id = (select auth.uid()))
  );
create policy "archive_item_flags_update_own" on public.archive_item_flags
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "archive_item_flags_delete_own" on public.archive_item_flags
  for delete to authenticated using ((select auth.uid()) = owner_id);
