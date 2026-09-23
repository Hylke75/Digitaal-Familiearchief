-- ===========================================================================
-- 0012 — search & hidden-filter indexes (performance)
-- ---------------------------------------------------------------------------
-- Two hot read paths currently do sequential scans:
--   * The archive browser filters out hidden items on every page load
--     (archive_item_flags where hidden). A partial composite index turns that
--     into an index-only scan of just the (few) hidden rows per owner.
--   * Search does a case-insensitive substring match on the file name AND the
--     extracted document text (metadata_json->>'text'). ILIKE '%q%' can't use a
--     btree, so we add pg_trgm GIN indexes for real prefix/substring lookup.
-- All additive; no data change.
-- ===========================================================================
create extension if not exists pg_trgm;

-- Hidden-filter: only hidden rows are indexed (partial), scoped by owner.
create index if not exists archive_item_flags_owner_hidden_idx
  on public.archive_item_flags (owner_id)
  where hidden = true;

-- Substring search over the file name.
create index if not exists archive_items_filename_trgm_idx
  on public.archive_items using gin (original_filename gin_trgm_ops);

-- Substring search over the extracted document text (content search, §B).
create index if not exists archive_items_doctext_trgm_idx
  on public.archive_items using gin ((metadata_json ->> 'text') gin_trgm_ops);
