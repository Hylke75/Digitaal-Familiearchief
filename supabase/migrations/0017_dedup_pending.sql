-- ===========================================================================
-- 0017 — archive_dedup_pending: omkeerbaar ontdubbelen
-- ---------------------------------------------------------------------------
-- Ontdubbelen maakt het archief beter, geen opschoonactie. Samenvoegen is
-- ALTIJD omkeerbaar: het duplicaat wordt verborgen (archive_item_flags.hidden)
-- en hier vastgelegd met het item waarin het is samengevoegd. Pas na 30 dagen
-- ruimt een achtergrondtaak het echt op — dan worden eerst de bronkoppelingen
-- overgezet naar het behouden item (§22: bewaar alle bronrelaties). Undo binnen
-- die 30 dagen = deze rij weg + zichtbaar maken.
-- ===========================================================================
create table public.archive_dedup_pending (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  -- Het verborgen duplicaat dat straks wordt opgeruimd.
  archive_item_id uuid not null references public.archive_items (id) on delete cascade,
  -- Het item waarin het is samengevoegd (waar de bronkoppelingen heen gaan).
  merged_into_id uuid references public.archive_items (id) on delete set null,
  created_at timestamptz not null default now(),
  purge_after timestamptz not null default (now() + interval '30 days'),
  unique (archive_item_id)
);

create index archive_dedup_pending_owner_idx on public.archive_dedup_pending (owner_id);
create index archive_dedup_pending_purge_idx on public.archive_dedup_pending (purge_after);

alter table public.archive_dedup_pending enable row level security;

-- User-authored (via de opruim-UI). De achtergrond-purge draait onder de
-- service role en omzeilt RLS.
create policy "archive_dedup_pending_select_own" on public.archive_dedup_pending
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "archive_dedup_pending_insert_own" on public.archive_dedup_pending
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "archive_dedup_pending_delete_own" on public.archive_dedup_pending
  for delete to authenticated using ((select auth.uid()) = owner_id);
