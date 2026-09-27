#!/usr/bin/env node
// ---------------------------------------------------------------------------
// `pnpm seed:demo:reset` (file-backed mode).
//
// In file-backed demo mode the demo lives entirely in generated files under
// /data/demo and apps/web/public/demo. There is no database, so "reset" means a
// clean, deterministic regeneration (reconcile) of that demo content. It never
// touches production data, and — because the build is idempotent — the result
// is byte-identical to a fresh seed.
//
// If you later wire a dedicated Supabase demo target, the reset there must
// delete ONLY rows marked is_demo = true for the demo user (§42, §43). That DB
// path is intentionally not run here (no target configured).
// ---------------------------------------------------------------------------
import { build } from './build-demo-data.mjs';

console.log('Resetting file-backed demo (regenerating /data/demo + placeholders)…');
const report = build({ quiet: true });
console.log(
  `Done. ${report.photos} photos, ${report.documents} documents, ${report.people} people, ` +
    `${report.albums} albums (+${report.smartAlbums} smart), ${report.memories} memories.`,
);
console.log('Production data was not touched (there is no demo database in file-backed mode).');
