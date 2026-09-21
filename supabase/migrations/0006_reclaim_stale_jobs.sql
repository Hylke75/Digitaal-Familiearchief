-- =============================================================================
-- Reclaim stale "running" jobs (resilience fix).
-- claim_due_jobs only picked up 'queued'/'retrying' jobs, so a job whose worker
-- died mid-run (function timeout, crash, deploy interruption) stayed 'running'
-- forever and was never retried — the archive silently stalled. This makes the
-- claim lease-based: a job still 'running' after its lease (15 min, comfortably
-- above the 800s function ceiling) is reclaimed and retried, with an attempts
-- counter so a genuinely poisonous job stops after a bounded number of tries
-- instead of looping. Queued/retrying behaviour is unchanged.
-- =============================================================================

create or replace function public.claim_due_jobs(p_limit int, p_worker text)
returns setof public.archive_jobs
  language sql
  set search_path = public
as $$
  with claimable as (
    select id, status from public.archive_jobs
    where (status in ('queued', 'retrying') and run_at <= now())
       or (status = 'running' and claimed_at < now() - interval '15 minutes' and attempts < 6)
    order by run_at, id
    for update skip locked
    limit p_limit
  )
  update public.archive_jobs j
     set status = 'running',
         claimed_at = now(),
         claimed_by = p_worker,
         started_at = coalesce(j.started_at, now()),
         attempts = j.attempts + case when c.status = 'running' then 1 else 0 end
    from claimable c
   where j.id = c.id
  returning j.*;
$$;
