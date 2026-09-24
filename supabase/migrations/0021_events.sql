-- ===========================================================================
-- 0021 — gedeelde gebeurtenissen (functie #3)
-- ---------------------------------------------------------------------------
-- Een trouwdag staat verspreid over zes toestellen; niemand heeft het complete
-- beeld. Familieleden dragen bij aan één gebeurtenis, zonder account, via een
-- uitnodigingslink. Bijdragen komen binnen als NIET-goedgekeurd en zijn pas
-- zichtbaar na goedkeuring door de eigenaar. Van het token bewaren we alleen de
-- hash. De gast schrijft nooit rechtstreeks; alles loopt via een service-role-
-- route.
-- ===========================================================================
create table public.archive_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  happened_on date,
  description text,
  cover_item_id uuid references public.archive_items (id) on delete set null,
  -- Standaard ziet een gast niets anders; de eigenaar kan de goedgekeurde
  -- foto's van de gebeurtenis tonen op de gastpagina.
  guests_see_photos boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index archive_events_owner_idx on public.archive_events (owner_id, happened_on desc);
create trigger archive_events_set_updated_at
  before update on public.archive_events
  for each row execute function public.set_updated_at();

create table public.archive_event_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.archive_events (id) on delete cascade,
  archive_item_id uuid not null references public.archive_items (id) on delete cascade,
  contributed_by_label text,
  approved boolean not null default false,
  added_at timestamptz not null default now(),
  unique (event_id, archive_item_id)
);
create index archive_event_items_event_idx on public.archive_event_items (event_id);
create index archive_event_items_item_idx on public.archive_event_items (archive_item_id);

create table public.archive_event_invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.archive_events (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  recipient_label text,
  expires_at timestamptz not null default (now() + interval '30 days'),
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index archive_event_invites_event_idx on public.archive_event_invites (event_id);

alter table public.archive_events enable row level security;
alter table public.archive_event_items enable row level security;
alter table public.archive_event_invites enable row level security;

-- events: user-authored, full CRUD own.
create policy "archive_events_select_own" on public.archive_events
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "archive_events_insert_own" on public.archive_events
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "archive_events_update_own" on public.archive_events
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "archive_events_delete_own" on public.archive_events
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- event_items: authorised via the parent event's ownership. Guest inserts go
-- through the service role, not this policy.
create policy "archive_event_items_select_own" on public.archive_event_items
  for select to authenticated using (
    exists (select 1 from public.archive_events e
            where e.id = event_id and e.owner_id = (select auth.uid())));
create policy "archive_event_items_insert_own" on public.archive_event_items
  for insert to authenticated with check (
    exists (select 1 from public.archive_events e
            where e.id = event_id and e.owner_id = (select auth.uid())));
create policy "archive_event_items_update_own" on public.archive_event_items
  for update to authenticated using (
    exists (select 1 from public.archive_events e
            where e.id = event_id and e.owner_id = (select auth.uid())));
create policy "archive_event_items_delete_own" on public.archive_event_items
  for delete to authenticated using (
    exists (select 1 from public.archive_events e
            where e.id = event_id and e.owner_id = (select auth.uid())));

-- invites: owner-only. Guests never read/write these directly (the route uses
-- the service role and matches on token_hash).
create policy "archive_event_invites_select_own" on public.archive_event_invites
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "archive_event_invites_insert_own" on public.archive_event_invites
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "archive_event_invites_update_own" on public.archive_event_invites
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "archive_event_invites_delete_own" on public.archive_event_invites
  for delete to authenticated using ((select auth.uid()) = owner_id);
