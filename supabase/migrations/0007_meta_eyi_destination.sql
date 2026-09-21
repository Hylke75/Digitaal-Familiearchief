-- =============================================================================
-- Meta EYI destination-OAuth + transfer tracking (docs/connectors/meta-eyi.md).
-- Bewora is the OAuth PROVIDER; Meta is the client. Meta authenticates against
-- Bewora's token endpoint, then PUSHES items to Bewora's importer endpoints.
-- Codes/tokens are stored ONLY as SHA-256 hashes (never raw). The OAuth/importer
-- routes run under the service role (Meta has no Bewora user session), so these
-- tables need no authenticated write policies; only the user's own transfer
-- jobs are readable via RLS for the dashboard.
-- =============================================================================

-- The registered Meta client (Bewora's own OAuth credentials, given to Meta).
create table public.meta_oauth_clients (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  client_secret_hash text not null,
  redirect_uris text[] not null default '{}', -- Meta's allowlisted redirect URLs
  name text,
  created_at timestamptz not null default now()
);

-- Short-lived, single-use authorization codes.
create table public.meta_oauth_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  client_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  connector_account_id uuid references public.connector_accounts (id) on delete cascade,
  redirect_uri text not null,
  scope text,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- Access + rotating refresh tokens (hashes only).
create table public.meta_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  access_token_hash text not null unique,
  refresh_token_hash text unique,
  client_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  connector_account_id uuid references public.connector_accounts (id) on delete cascade,
  scope text,
  access_expires_at timestamptz not null,
  refresh_expires_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Per-transfer tracking (initial + recurring). No completion webhook exists, so
-- Bewora updates counts as items arrive.
create table public.meta_transfer_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  connector_account_id uuid references public.connector_accounts (id) on delete cascade,
  source_type text not null, -- facebook | instagram
  transfer_kind text not null default 'INITIAL', -- INITIAL | RECURRING
  status text not null default 'WAITING',
  items_seen integer not null default 0,
  items_new integer not null default 0,
  items_duplicate integer not null default 0,
  items_failed integer not null default 0,
  bytes_received bigint not null default 0,
  requested_at timestamptz default now(),
  received_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meta_oauth_clients enable row level security;
alter table public.meta_oauth_codes enable row level security;
alter table public.meta_oauth_tokens enable row level security;
alter table public.meta_transfer_jobs enable row level security;

-- Only the user's own transfer jobs are readable (dashboard). Everything else is
-- service-role only (no policies = default deny for authenticated/anon).
create policy "meta_transfer_jobs_select_own" on public.meta_transfer_jobs
  for select to authenticated using (user_id = (select auth.uid()));

create index meta_oauth_codes_code_idx on public.meta_oauth_codes (code_hash);
create index meta_oauth_tokens_access_idx on public.meta_oauth_tokens (access_token_hash);
create index meta_oauth_tokens_refresh_idx on public.meta_oauth_tokens (refresh_token_hash);
create index meta_transfer_jobs_user_idx on public.meta_transfer_jobs (user_id);

create trigger meta_transfer_jobs_set_updated_at
  before update on public.meta_transfer_jobs
  for each row execute function public.set_updated_at();
