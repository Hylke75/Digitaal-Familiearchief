-- ===========================================================================
-- 0015 — archive_stories: gesproken verhalen bij een item of album
-- ---------------------------------------------------------------------------
-- Een foto zonder uitleg is over twee generaties een onbekende in een vreemde
-- tuin. Een verhaal legt in de stem van wie erbij was vast wie erop staat en
-- wat er gebeurde. De AUDIO is het archiefstuk; het transcript is bijvangst.
--
-- De audio staat in een aparte privé-bucket `verhalen` (niet in `archief`),
-- met hetzelfde owner-padpatroon (stories/<owner_id>/…) als de rest. RLS:
-- alleen de eigenaar leest/schrijft. Gastverhalen (Onderdeel C) worden later
-- via de service role geschreven en zijn pas zichtbaar na goedkeuring
-- (`approved`), vandaar dat dat veld hier al bestaat (default true voor de
-- eigenaar zelf).
-- ===========================================================================
create type public.transcript_status as enum ('pending', 'processing', 'done', 'failed');
create type public.story_source as enum ('owner', 'guest');

create table public.archive_stories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  -- Precies één doel: een item OF een album.
  archive_item_id uuid references public.archive_items (id) on delete cascade,
  album_id uuid references public.archive_albums (id) on delete cascade,
  audio_storage_key text not null,
  audio_mime_type text not null,
  duration_ms integer,
  transcript text,
  transcript_status public.transcript_status not null default 'pending',
  narrator_person_id uuid references public.archive_people (id) on delete set null,
  narrator_name text,
  source public.story_source not null default 'owner',
  -- Owner-opnames zijn meteen zichtbaar; gastverhalen wachten op goedkeuring.
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint archive_stories_one_target
    check ((archive_item_id is not null)::int + (album_id is not null)::int = 1)
);

create index archive_stories_owner_idx on public.archive_stories (owner_id, created_at desc);
create index archive_stories_item_idx on public.archive_stories (archive_item_id);
create index archive_stories_album_idx on public.archive_stories (album_id);
create index archive_stories_status_idx
  on public.archive_stories (transcript_status)
  where transcript_status in ('pending', 'processing');

create trigger archive_stories_set_updated_at
  before update on public.archive_stories
  for each row execute function public.set_updated_at();

alter table public.archive_stories enable row level security;

create policy "archive_stories_select_own" on public.archive_stories
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "archive_stories_insert_own" on public.archive_stories
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "archive_stories_update_own" on public.archive_stories
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "archive_stories_delete_own" on public.archive_stories
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- ---------------------------------------------------------------------------
-- Private storage bucket for story audio (same owner-folder RLS as `archief`).
-- Keys: stories/<owner_id>/<story-or-random>.<ext> → segment [2] is the owner.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('verhalen', 'verhalen', false)
on conflict (id) do nothing;

create policy "verhalen_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'verhalen' and (storage.foldername(name))[2] = (select auth.uid())::text
  );
create policy "verhalen_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'verhalen' and (storage.foldername(name))[2] = (select auth.uid())::text
  );
create policy "verhalen_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'verhalen' and (storage.foldername(name))[2] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'verhalen' and (storage.foldername(name))[2] = (select auth.uid())::text
  );
create policy "verhalen_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'verhalen' and (storage.foldername(name))[2] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- archive_register_story — owner-scoped write path (like archive_register_
-- derivative). The owner uploads the audio to their own storage folder, then
-- registers the row here. Validates ownership of the target item/album and the
-- named person. Returns the new story id. Guest stories (Onderdeel C) use the
-- service role instead and are not created through this function.
-- ---------------------------------------------------------------------------
create or replace function public.archive_register_story(
  p_archive_item_id uuid,
  p_album_id uuid,
  p_audio_storage_key text,
  p_audio_mime_type text,
  p_duration_ms integer default null,
  p_narrator_person_id uuid default null,
  p_narrator_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_id uuid;
begin
  if v_owner is null then
    raise exception 'not authenticated';
  end if;
  if (p_archive_item_id is not null)::int + (p_album_id is not null)::int <> 1 then
    raise exception 'exactly one of item/album required';
  end if;
  if p_archive_item_id is not null and not exists (
    select 1 from public.archive_items where id = p_archive_item_id and owner_id = v_owner
  ) then
    raise exception 'item not found or not owned';
  end if;
  if p_album_id is not null and not exists (
    select 1 from public.archive_albums where id = p_album_id and owner_id = v_owner
  ) then
    raise exception 'album not found or not owned';
  end if;
  if p_narrator_person_id is not null and not exists (
    select 1 from public.archive_people where id = p_narrator_person_id and owner_id = v_owner
  ) then
    raise exception 'person not found or not owned';
  end if;

  insert into public.archive_stories
    (owner_id, archive_item_id, album_id, audio_storage_key, audio_mime_type,
     duration_ms, narrator_person_id, narrator_name, source, approved, transcript_status)
  values
    (v_owner, p_archive_item_id, p_album_id, p_audio_storage_key, p_audio_mime_type,
     p_duration_ms, p_narrator_person_id, nullif(btrim(p_narrator_name), ''), 'owner', true, 'pending')
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.archive_register_story(uuid, uuid, text, text, integer, uuid, text)
  from public, anon;
grant execute on function public.archive_register_story(uuid, uuid, text, text, integer, uuid, text)
  to authenticated;
