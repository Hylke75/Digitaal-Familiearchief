-- ===========================================================================
-- 0019 — archive_chapters: hoofdstukken in de tijdlijn
-- ---------------------------------------------------------------------------
-- Een leven bestaat niet uit 240 maanden maar uit een stuk of vijftien
-- periodes: studie, het huis aan de Laan, de jaren met kleine kinderen. Dit is
-- het ontbrekende niveau tussen moment en jaar. Een hoofdstuk heeft een periode
-- (starts_on..ends_on; een lopend hoofdstuk heeft geen einde) en mag met andere
-- hoofdstukken overlappen. User-authored: de eigenaar heeft volledige CRUD.
-- Een verhaal (archive_stories) kan later aan een hoofdstuk hangen; de stabiele
-- uuid maakt dat mogelijk zonder wijziging hier.
-- ===========================================================================
create table public.archive_chapters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  starts_on date not null,
  ends_on date,
  cover_item_id uuid references public.archive_items (id) on delete set null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint archive_chapters_period check (ends_on is null or ends_on >= starts_on)
);

create index archive_chapters_owner_idx on public.archive_chapters (owner_id, starts_on desc);

create trigger archive_chapters_set_updated_at
  before update on public.archive_chapters
  for each row execute function public.set_updated_at();

alter table public.archive_chapters enable row level security;

create policy "archive_chapters_select_own" on public.archive_chapters
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "archive_chapters_insert_own" on public.archive_chapters
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "archive_chapters_update_own" on public.archive_chapters
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "archive_chapters_delete_own" on public.archive_chapters
  for delete to authenticated using ((select auth.uid()) = owner_id);
