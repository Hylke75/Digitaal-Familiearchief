import { describe, expect, it } from 'vitest';
import { Constants } from './types.gen';

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
