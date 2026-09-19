-- =============================================================================
-- Digital Life Archive — initial schema (CLAUDE.md Phase 1)
-- Core tables: profiles, connector_accounts, archive_items,
-- archive_item_sources, archive_jobs, security_audit_events.
-- Row Level Security is DEFAULT DENY: RLS is enabled on every user table and
-- access is granted only by the explicit owner-scoped policies below (§43).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums (mirror the @dla/archive and @dla/connectors domain types)
-- ---------------------------------------------------------------------------
create type connector_category as enum ('photo_video', 'social', 'documents', 'device');
create type connector_type as enum ('live', 'portability', 'archive_importer');
create type implementation_status as enum (
  'research', 'verified', 'development', 'provider_approval', 'beta', 'production', 'disabled'
);
create type connector_account_status as enum (
  'connected', 'archiving', 'action_required', 'temporary_problem', 'disconnected'
);
create type archive_frequency as enum ('daily', 'weekly', 'monthly');
create type archive_item_type as enum (
  'photo', 'video', 'document', 'post', 'message', 'audio', 'other'
);
create type archive_item_status as enum ('pending', 'storing', 'archived', 'failed');
create type job_type as enum (
  'discovery', 'initial_import', 'incremental_import', 'export', 'integrity_check'
);
create type job_status as enum (
  'queued', 'running', 'completed', 'failed', 'retrying', 'cancelled'
);

-- ---------------------------------------------------------------------------
-- Shared trigger to maintain updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- connector_accounts — a user's connection to a source (§24)
-- Sensitive provider credentials are NOT stored here as plaintext (§45);
-- cursor_state_encrypted holds only opaque, encrypted cursor state.
-- ---------------------------------------------------------------------------
create table public.connector_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  connector_key text not null,
  provider_account_identifier text,
  display_name text,
  status connector_account_status not null default 'connected',
  connected_at timestamptz,
  last_successful_archive_at timestamptz,
  last_attempt_at timestamptz,
  authorization_expires_at timestamptz,
  archive_frequency archive_frequency not null default 'daily',
  cursor_state_encrypted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index connector_accounts_user_id_idx on public.connector_accounts (user_id);

create trigger connector_accounts_set_updated_at
  before update on public.connector_accounts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- archive_items — generic archived object (§21). Originals are immutable.
-- ---------------------------------------------------------------------------
create table public.archive_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  type archive_item_type not null,
  original_filename text not null,
  mime_type text not null,
  file_size bigint not null default 0,
  checksum_sha256 text not null,
  created_at_source timestamptz,
  modified_at_source timestamptz,
  archived_at timestamptz,
  storage_provider text not null,
  storage_key text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  status archive_item_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Exact-binary dedup per owner (§23): one physical item per (owner, checksum).
  unique (owner_id, checksum_sha256)
);

create index archive_items_owner_id_idx on public.archive_items (owner_id);
create index archive_items_owner_type_idx on public.archive_items (owner_id, type);
create index archive_items_owner_created_source_idx
  on public.archive_items (owner_id, created_at_source desc);

create trigger archive_items_set_updated_at
  before update on public.archive_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- archive_item_sources — where an item was found (§22). Source deletion is
-- recorded (source_deleted_at) but never propagated to the archive item (§4).
-- ---------------------------------------------------------------------------
create table public.archive_item_sources (
  id uuid primary key default gen_random_uuid(),
  archive_item_id uuid not null references public.archive_items (id) on delete cascade,
  connector_account_id uuid references public.connector_accounts (id) on delete set null,
  source_item_id text,
  source_url_if_safe text,
  source_created_at timestamptz,
  source_modified_at timestamptz,
  source_deleted_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index archive_item_sources_item_idx on public.archive_item_sources (archive_item_id);
create index archive_item_sources_account_idx on public.archive_item_sources (connector_account_id);

-- ---------------------------------------------------------------------------
-- archive_jobs — persistent, backend-controlled jobs (§26). No sensitive
-- content in error fields; only a safe consumer message.
-- ---------------------------------------------------------------------------
create table public.archive_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  connector_account_id uuid references public.connector_accounts (id) on delete cascade,
  job_type job_type not null,
  status job_status not null default 'queued',
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  items_discovered integer not null default 0,
  items_processed integer not null default 0,
  items_archived integer not null default 0,
  items_skipped integer not null default 0,
  items_failed integer not null default 0,
  bytes_processed bigint not null default 0,
  retry_count integer not null default 0,
  error_code text,
  safe_error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index archive_jobs_user_idx on public.archive_jobs (user_id);
create index archive_jobs_account_idx on public.archive_jobs (connector_account_id);
create index archive_jobs_status_idx on public.archive_jobs (status);

create trigger archive_jobs_set_updated_at
  before update on public.archive_jobs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- security_audit_events — auditable security events (§47). Never private content.
-- ---------------------------------------------------------------------------
create table public.security_audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  context_json jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index security_audit_events_user_idx on public.security_audit_events (user_id, occurred_at desc);

-- =============================================================================
-- Row Level Security — DEFAULT DENY. Enable RLS, then grant only owner access.
-- Frontend filtering is never the boundary (§43). The service role bypasses RLS
-- for privileged, server-side archive/audit writes (§44).
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.connector_accounts enable row level security;
alter table public.archive_items enable row level security;
alter table public.archive_item_sources enable row level security;
alter table public.archive_jobs enable row level security;
alter table public.security_audit_events enable row level security;

-- profiles: a user sees and edits only their own profile.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- connector_accounts: owner-scoped full access.
create policy "connector_accounts_select_own" on public.connector_accounts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "connector_accounts_insert_own" on public.connector_accounts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "connector_accounts_update_own" on public.connector_accounts
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "connector_accounts_delete_own" on public.connector_accounts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- archive_items: owner-scoped read. Writes are performed server-side by the
-- archive engine (service role); no authenticated write policy is granted, so
-- a user can never fabricate an archived item directly.
create policy "archive_items_select_own" on public.archive_items
  for select to authenticated using ((select auth.uid()) = owner_id);

-- archive_item_sources: readable when the parent item belongs to the user.
create policy "archive_item_sources_select_own" on public.archive_item_sources
  for select to authenticated using (
    exists (
      select 1 from public.archive_items ai
      where ai.id = archive_item_sources.archive_item_id
        and ai.owner_id = (select auth.uid())
    )
  );

-- archive_jobs: owner-scoped read (operational status). Writes are server-side.
create policy "archive_jobs_select_own" on public.archive_jobs
  for select to authenticated using ((select auth.uid()) = user_id);

-- security_audit_events: owner-scoped read only. Writes are server-side.
create policy "security_audit_events_select_own" on public.security_audit_events
  for select to authenticated using ((select auth.uid()) = user_id);
