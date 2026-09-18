/**
 * @dla/archive — the provider-independent archive domain model
 * (CLAUDE.md §20–§27, §50). These types mirror the database schema built in
 * Phase 1 but stay free of any Supabase specifics.
 */

export type ArchiveItemType =
  'photo' | 'video' | 'document' | 'post' | 'message' | 'audio' | 'other';

/**
 * Trust-first status (CLAUDE.md §72): an item is only `archived` once durable
 * storage AND database metadata are both confirmed. `pending`/`storing` map to
 * the consumer state "Bezig met veiligstellen".
 */
export type ArchiveItemStatus = 'pending' | 'storing' | 'archived' | 'failed';

export interface ArchiveItem {
  id: string;
  ownerId: string;
  type: ArchiveItemType;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  checksumSha256: string;
  createdAtSource?: string;
  modifiedAtSource?: string;
  archivedAt?: string;
  storageProvider: string;
  storageKey: string;
  metadata: Record<string, unknown>;
  status: ArchiveItemStatus;
  createdAt: string;
  updatedAt: string;
}

/** A place where an archive item was found; source deletion is recorded, never propagated. */
export interface ArchiveItemSource {
  id: string;
  archiveItemId: string;
  connectorAccountId: string;
  sourceItemId: string;
  sourceUrlIfSafe?: string;
  sourceCreatedAt?: string;
  sourceModifiedAt?: string;
  /** Set when the source copy disappears; the archived copy is retained (CLAUDE.md §4). */
  sourceDeletedAt?: string;
  metadata: Record<string, unknown>;
}

export type JobType =
  'discovery' | 'initial_import' | 'incremental_import' | 'export' | 'integrity_check';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'retrying' | 'cancelled';

export type ArchiveErrorClass =
  'temporary' | 'authentication' | 'rate_limit' | 'permanent_item' | 'provider_outage' | 'internal';

export interface ArchiveJob {
  id: string;
  userId: string;
  connectorAccountId: string;
  jobType: JobType;
  status: JobStatus;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  itemsDiscovered: number;
  itemsProcessed: number;
  itemsArchived: number;
  itemsSkipped: number;
  itemsFailed: number;
  bytesProcessed: number;
  retryCount: number;
  errorCode?: string;
  /** Consumer-safe message; raw provider errors never reach the UI (CLAUDE.md §51). */
  safeErrorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

/** Consumer-facing health (CLAUDE.md §50). Internal detail stays out of the UI. */
export type HealthStatus = 'safe' | 'archiving' | 'action_required' | 'temporary_problem';
