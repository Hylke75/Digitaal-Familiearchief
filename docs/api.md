# API

_Status: Phase 0 — no application API endpoints exist yet._

This document will describe the app's server API (Route Handlers / Server Actions)
and Supabase Edge Functions as they are built.

## Conventions (to apply from Phase 2 onward)

- **Auth**: endpoints operate under the caller's Supabase session; RLS enforces
  per-user access. Privileged operations run server-side with the service-role
  client only where strictly necessary (§44).
- **Errors**: consumers never see raw stack traces or provider errors. Technical
  detail stays in protected operational logs; responses carry safe, human
  messages (§51).
- **Validation**: all input is validated (zod) at the boundary (§42).
- **Idempotency**: mutating archive operations are idempotent; retries must not
  duplicate records (§6).
- **Observability**: import/archive operations carry a trace id
  (`IMP-YYYYMMDD-NNNNN`, see `@dla/shared#importTraceId`), logged without secrets
  or private content (§49).

## Planned surfaces

- Auth callbacks (Phase 2).
- Connector connect/disconnect/reauthorise + status (Phase 3+).
- Archive browser read endpoints with signed original download (Phase 8).
- Export job request/download (Phase 11).
- Scheduler/worker triggers for continuous archiving (Phase 6) — backend-driven,
  never dependent on an open browser (§25).
