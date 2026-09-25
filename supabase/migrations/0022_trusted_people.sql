-- ===========================================================================
-- 0022 — nalatenschap: vertrouwde personen (functie #10, "Als mij iets overkomt")
-- ---------------------------------------------------------------------------
-- De eigenaar wijst vertrouwde personen aan en kiest per persoon waar zij LATER
-- bij mogen (foto's/video's, familiearchief, sociale media, documenten). Dit is
-- bewust ALLEEN het vastleggen van wensen + een contactbevestiging.
--
-- Uitdrukkelijk NIET (CLAUDE.md §38–39): geen automatische overdracht, geen
-- "meld overlijden → toegang", geen identiteitsverificatie. Deze tabel verleent
-- op zichzelf GEEN toegang tot het archief; de scope-vlaggen zijn een intentie
-- voor later, na aparte juridische review. Van de bevestigingslink bewaren we
-- alleen de hash; de vertrouwde persoon bevestigt enkel naam/contact (geen
-- account, geen inzage).
-- ===========================================================================
create table public.archive_trusted_people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  email text,
  -- Waar deze persoon LATER bij mag (intentie, geen actieve toegang):
  scope_photos boolean not null default true,
  scope_family boolean not null default true,
  scope_social boolean not null default false,
  scope_documents boolean not null default false,
  -- Bevestigingslink (optioneel): alleen de hash, net als bij gebeurtenissen.
  token_hash text unique,
  -- Wat de persoon zelf bevestigde (geen archieftoegang, alleen contact):
  confirmed_at timestamptz,
  confirmed_name text,
  confirmed_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index archive_trusted_people_owner_idx on public.archive_trusted_people (owner_id, created_at desc);
create trigger archive_trusted_people_set_updated_at
  before update on public.archive_trusted_people
  for each row execute function public.set_updated_at();

alter table public.archive_trusted_people enable row level security;

-- Owner-only CRUD. De publieke bevestiging loopt via een service-role-route en
-- matcht op token_hash — nooit rechtstreeks door de vertrouwde persoon.
create policy "archive_trusted_people_select_own" on public.archive_trusted_people
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "archive_trusted_people_insert_own" on public.archive_trusted_people
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "archive_trusted_people_update_own" on public.archive_trusted_people
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "archive_trusted_people_delete_own" on public.archive_trusted_people
  for delete to authenticated using ((select auth.uid()) = owner_id);
