-- ===========================================================================
-- 0018 — job_type 'deduplication'
-- ---------------------------------------------------------------------------
-- Achtergrondtaak voor het echte opruimen van samengevoegde duplicaten na de
-- 30-dagen-termijn. Geïsoleerd: een nieuwe enum-waarde moet gecommit zijn
-- voordat hij gebruikt kan worden, dus hier wordt hij niet gebruikt.
-- ===========================================================================
alter type public.job_type add value if not exists 'deduplication';
