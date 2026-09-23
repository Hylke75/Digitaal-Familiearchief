-- ===========================================================================
-- 0016 — job_type 'transcribe'
-- ---------------------------------------------------------------------------
-- A new background job type for speech-to-text, processed by the existing cron
-- worker. Isolated in its own migration: a new enum value must be committed
-- before it can be used, so nothing here references it.
-- ===========================================================================
alter type public.job_type add value if not exists 'transcribe';
