-- ===========================================================================
-- 0013 — audit_log: owner-scoped security audit trail (§47)
-- ---------------------------------------------------------------------------
-- security_audit_events was created in 0001 with a SELECT-own policy but no
-- write path, so the required audit trail (login, logout, export requested,
-- account-deletion requested, connector connected/disconnected) was never
-- actually written. This SECURITY DEFINER function is the vetted write path:
-- it only ever records an event for the calling user, and the context is
-- caller-supplied metadata — never private archive content (§47, §49).
-- ===========================================================================
create or replace function public.audit_log(
  p_type text,
  p_context jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    return; -- unauthenticated calls are silently ignored, never an error path
  end if;
  if p_type is null or btrim(p_type) = '' then
    raise exception 'audit type required';
  end if;
  insert into public.security_audit_events (user_id, type, context_json)
  values (v_user, btrim(p_type), coalesce(p_context, '{}'::jsonb));
end;
$$;

revoke all on function public.audit_log(text, jsonb) from public, anon;
grant execute on function public.audit_log(text, jsonb) to authenticated;
