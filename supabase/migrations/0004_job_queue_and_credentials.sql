-- =============================================================================
-- Live-connector job queue + encrypted provider credentials
-- (docs/connectors/ARCHITECTURE.md). A Postgres SKIP LOCKED queue with per-file
-- rows gives resumable, idempotent background archiving; the worker runs under
-- the service role. Provider refresh tokens are stored encrypted, written only
-- via a SECURITY DEFINER RPC bound to auth.uid().
-- =============================================================================

-- Extend archive_jobs with scheduler + lease + cursor fields.
alter table public.archive_jobs
  add column if not exists run_at timestamptz not null default now(),
  add column if not exists claimed_at timestamptz,
  add column if not exists claimed_by text,
  add column if not exists attempts integer not null default 0,
  add column if not exists cursor jsonb,
  add column if not exists next_archive_at timestamptz,
  add column if not exists last_error text;

create index if not exists archive_jobs_due_idx
  on public.archive_jobs (run_at, id)
  where status in ('queued', 'running', 'retrying');

-- Per-file work rows: the unit of resumability AND idempotency.
create table public.archive_job_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.archive_jobs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  connector_account_id uuid references public.connector_accounts (id) on delete cascade,
  source_item_id text not null,
  source_etag text,
  filename text,
  mime_type text,
  size_bytes bigint,
  status text not null default 'pending', -- pending|running|done|failed|dead|deleted
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  claimed_at timestamptz,
  claimed_by text,
  storage_key text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, source_item_id)
);

create index archive_job_items_claim_idx
  on public.archive_job_items (job_id, next_attempt_at, id)
  where status in ('pending', 'failed', 'running');
create index archive_job_items_user_idx on public.archive_job_items (user_id);

create trigger archive_job_items_set_updated_at
  before update on public.archive_job_items
  for each row execute function public.set_updated_at();

-- Encrypted provider credentials (refresh tokens etc.). Never plaintext.
create table public.connector_credentials (
  id uuid primary key default gen_random_uuid(),
  connector_account_id uuid not null references public.connector_accounts (id) on delete cascade,
  kind text not null,
  scheme text not null,
  ciphertext text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connector_account_id, kind)
);

create trigger connector_credentials_set_updated_at
  before update on public.connector_credentials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.archive_job_items enable row level security;
alter table public.connector_credentials enable row level security;

-- Users may read their own job items (progress UI); writes are worker-only.
create policy "archive_job_items_select_own" on public.archive_job_items
  for select to authenticated using ((select auth.uid()) = user_id);

-- connector_credentials: DEFAULT DENY for anon/authenticated (no policies).
-- Reads happen only via the service-role worker; writes via the RPC below.

-- ---------------------------------------------------------------------------
-- Store an encrypted credential (called from the OAuth callback, as the user).
-- ---------------------------------------------------------------------------
create or replace function public.store_connector_credential(
  p_connector_account_id uuid,
  p_kind text,
  p_scheme text,
  p_ciphertext text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
begin
  if v_owner is null then raise exception 'not authenticated'; end if;
  if not exists (
    select 1 from public.connector_accounts
    where id = p_connector_account_id and user_id = v_owner
  ) then
    raise exception 'connector account not found for user';
  end if;

  insert into public.connector_credentials (connector_account_id, kind, scheme, ciphertext)
  values (p_connector_account_id, p_kind, p_scheme, p_ciphertext)
  on conflict (connector_account_id, kind)
  do update set scheme = excluded.scheme, ciphertext = excluded.ciphertext, updated_at = now();
end;
$$;

revoke all on function public.store_connector_credential(uuid, text, text, text) from public, anon;
grant execute on function public.store_connector_credential(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Claim a batch of due items with FOR UPDATE SKIP LOCKED + a 10-minute lease.
-- Worker-only (service role).
-- ---------------------------------------------------------------------------
create or replace function public.claim_job_items(p_job uuid, p_limit int, p_worker text)
returns setof public.archive_job_items
  language sql
  set search_path = public
as $$
  with claimed as (
    select id from public.archive_job_items
    where job_id = p_job
      and next_attempt_at <= now()
      and (
        status in ('pending', 'failed')
        or (status = 'running' and claimed_at < now() - interval '10 minutes')
      )
    order by next_attempt_at, id
    for update skip locked
    limit p_limit
  )
  update public.archive_job_items i
     set status = 'running', claimed_at = now(), claimed_by = p_worker, attempts = i.attempts + 1
    from claimed
   where i.id = claimed.id
  returning i.*;
$$;

revoke all on function public.claim_job_items(uuid, int, text) from public, anon, authenticated;

-- Claim due jobs (scheduler/worker). Worker-only.
create or replace function public.claim_due_jobs(p_limit int, p_worker text)
returns setof public.archive_jobs
  language sql
  set search_path = public
as $$
  with claimed as (
    select id from public.archive_jobs
    where status in ('queued', 'retrying')
      and run_at <= now()
    order by run_at, id
    for update skip locked
    limit p_limit
  )
  update public.archive_jobs j
     set status = 'running', claimed_at = now(), claimed_by = p_worker, started_at = coalesce(j.started_at, now())
    from claimed
   where j.id = claimed.id
  returning j.*;
$$;

revoke all on function public.claim_due_jobs(int, text) from public, anon, authenticated;
