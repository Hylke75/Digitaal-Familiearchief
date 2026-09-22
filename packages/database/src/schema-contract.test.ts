import { describe, expect, it } from 'vitest';
import { Constants } from './types.gen';
import type { Database, TablesInsert, TablesUpdate } from './types.gen';

/**
 * Contract test: the database enums (generated from the live schema) must stay
 * in sync with the domain unions in @dla/archive and @dla/connectors. If a
 * migration changes an enum, this test fails until the domain types and this
 * expectation are updated together — catching schema/domain drift early.
 */
describe('database enum contract', () => {
  it('archive_item_type matches the domain', () => {
    expect(Constants.public.Enums.archive_item_type).toEqual([
      'photo',
      'video',
      'document',
      'post',
      'message',
      'audio',
      'other',
    ]);
  });

  it('archive_item_status matches the trust-first lifecycle', () => {
    expect(Constants.public.Enums.archive_item_status).toEqual([
      'pending',
      'storing',
      'archived',
      'failed',
    ]);
  });

  it('archive_frequency matches daily/weekly/monthly', () => {
    expect(Constants.public.Enums.archive_frequency).toEqual(['daily', 'weekly', 'monthly']);
  });

  it('job_type and job_status match the job system', () => {
    expect(Constants.public.Enums.job_type).toEqual([
      'discovery',
      'initial_import',
      'incremental_import',
      'export',
      'integrity_check',
    ]);
    expect(Constants.public.Enums.job_status).toEqual([
      'queued',
      'running',
      'completed',
      'failed',
      'retrying',
      'cancelled',
    ]);
  });

  it('connector_account_status matches the consumer health mapping', () => {
    expect(Constants.public.Enums.connector_account_status).toEqual([
      'connected',
      'archiving',
      'action_required',
      'temporary_problem',
      'disconnected',
    ]);
  });
});

/**
 * Contract test for the archive-experience canonical model (migration 0008).
 * These are compile-time assertions: the typed literals below only build if the
 * tables/columns exist with the expected names, so tsc/CI fails on schema drift.
 */
describe('archive experience schema contract', () => {
  it('exposes the canonical tables and their key columns', () => {
    const album: TablesInsert<'archive_albums'> = { owner_id: 'u', title: 'Zomer 2024' };
    const albumItem: TablesInsert<'archive_album_items'> = {
      album_id: 'a',
      archive_item_id: 'i',
    };
    const derivative: TablesInsert<'archive_derivatives'> = {
      owner_id: 'u',
      archive_item_id: 'i',
      kind: 'thumb',
      storage_key: 'archive/u/xx/sha',
      mime_type: 'image/webp',
    };
    const person: TablesInsert<'archive_people'> = { owner_id: 'u', display_name: 'Oma' };
    const place: TablesInsert<'archive_places'> = { owner_id: 'u', name: 'Thuis' };
    const flag: TablesInsert<'archive_item_flags'> = { owner_id: 'u', archive_item_id: 'i' };

    // The normalised capture-metadata columns on archive_items.
    const item: TablesUpdate<'archive_items'> = {
      taken_at: null,
      latitude: 52.37,
      longitude: 4.9,
      width: 4032,
      height: 3024,
      duration_ms: null,
      camera: 'iPhone 15',
    };

    expect([
      album.title,
      albumItem.album_id,
      derivative.kind,
      person.display_name,
      place.name,
      flag.owner_id,
      item.camera,
    ]).toHaveLength(7);
  });

  it('archive_ingest_item accepts an optional metadata payload', () => {
    const args: Database['public']['Functions']['archive_ingest_item']['Args'] = {
      p_connector_account_id: 'c',
      p_type: 'photo',
      p_original_filename: 'foto.jpg',
      p_mime_type: 'image/jpeg',
      p_file_size: 1024,
      p_checksum_sha256: 'deadbeef',
      p_storage_provider: 'supabase',
      p_storage_key: 'archive/u/de/deadbeef',
      p_source_item_id: 'src-1',
      p_metadata: { takenAt: '2024-06-01T12:00:00Z', latitude: 52.37, longitude: 4.9 },
    };
    expect(args.p_metadata).toBeTruthy();
  });
});
