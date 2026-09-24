-- ===========================================================================
-- 0020 — personen krijgen relaties (functie #4)
-- ---------------------------------------------------------------------------
-- Genoeg structuur om foto's over generaties vindbaar te maken — geen
-- stamboomproduct. Personen krijgen optionele geboorte-/sterfdatum + notitie.
-- Relaties worden ÉÉN keer opgeslagen (person_id -> related_person_id met een
-- type); de omgekeerde richting leiden we in de query af. Een persoon kan nooit
-- aan zichzelf gekoppeld worden. Alles owner-scoped.
-- ===========================================================================
alter table public.archive_people
  add column if not exists birth_date date,
  add column if not exists death_date date,
  add column if not exists note text;

create type public.person_relation as enum ('ouder_van', 'partner_van', 'broer_zus_van');

create table public.archive_person_relations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  person_id uuid not null references public.archive_people (id) on delete cascade,
  related_person_id uuid not null references public.archive_people (id) on delete cascade,
  relation public.person_relation not null,
  created_at timestamptz not null default now(),
  constraint archive_person_relations_no_self check (person_id <> related_person_id),
  unique (owner_id, person_id, related_person_id, relation)
);

create index archive_person_relations_person_idx
  on public.archive_person_relations (person_id);
create index archive_person_relations_related_idx
  on public.archive_person_relations (related_person_id);

alter table public.archive_person_relations enable row level security;

create policy "archive_person_relations_select_own" on public.archive_person_relations
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "archive_person_relations_insert_own" on public.archive_person_relations
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "archive_person_relations_delete_own" on public.archive_person_relations
  for delete to authenticated using ((select auth.uid()) = owner_id);
