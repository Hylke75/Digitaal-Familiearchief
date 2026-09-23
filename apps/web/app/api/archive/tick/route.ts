import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';
import { randomToken } from '@dla/security';
import {
  archiveTypeFromMime,
  LiveSourceError,
  type LiveSourceClient,
  type PortabilityClient,
} from '@dla/connectors';
import { detectImporter, listZipEntries, readZipSafely } from '@dla/import';
import { contentStorageKey, sha256Hex } from '@dla/archive';
import { createAdminClient } from '@/lib/supabase/admin';
import { SupabaseStorageProvider } from '@/lib/archive/supabase-storage';
import { generateThumbnailBatch, generateVideoPosterBatch } from '@/lib/archive/derivatives';
import { extractDocumentTextBatch } from '@/lib/archive/pdf-text';
import { transcribeJob } from '@/lib/archive/transcribe';
import { getLiveProvider } from '@/lib/connectors/live-providers';
import { getPortabilityProvider } from '@/lib/connectors/portability-providers';
import { getAccessToken } from '@/lib/connectors/token';

export const runtime = 'nodejs';
export const maxDuration = 800;
export const dynamic = 'force-dynamic';

type Admin = SupabaseClient<Database>;
type JobRow = Database['public']['Tables']['archive_jobs']['Row'];
type ItemRow = Database['public']['Tables']['archive_job_items']['Row'];
type AccountRow = Database['public']['Tables']['connector_accounts']['Row'];

const MAX_ATTEMPTS = 6;

function backoffMs(attempts: number): number {
  const base = Math.min(2 ** attempts * 1000, 3_600_000);
  return base + Math.floor(Math.random() * 1000);
}

/** Bound a promise so one hung download cannot occupy a pool slot indefinitely.
 * A timeout is a transient failure — the item is retried later, never dropped. */
function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new LiveSourceError('transient', message)), ms);
    p.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function POST(request: NextRequest) {
  return handle(request);
}
export async function GET(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let admin: Admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ ok: false, error: 'service role not configured' }, { status: 503 });
  }

  const worker = randomToken(8);
  // Stop claiming new batches ~100s before the 800s wall so in-flight downloads
  // finish and the job requeues itself cleanly (avoids wall-deaths that would
  // otherwise need the slower stale-lease reclaim).
  const deadline = Date.now() + 700_000;
  const { data: jobs } = await admin.rpc('claim_due_jobs', { p_limit: 3, p_worker: worker });

  let processed = 0;
  for (const job of (jobs ?? []) as JobRow[]) {
    if (Date.now() >= deadline) {
      await requeue(admin, job.id, 0);
      continue;
    }
    // Transcription jobs carry a story id in the cursor, not a connector account.
    if (job.job_type === 'transcribe') {
      await transcribeJob(admin, job);
      processed += 1;
      continue;
    }
    await processJob(admin, job, worker, deadline);
    processed += 1;
  }

  // Generate a small batch of missing photo thumbnails (incl. HEIC) each tick —
  // bounded, idempotent, and skipped when we're near the wall.
  let thumbnails = 0;
  let posters = 0;
  let docText = 0;
  if (Date.now() < deadline) {
    try {
      thumbnails = await generateThumbnailBatch(admin, 12);
    } catch {
      // Thumbnail generation is best-effort; never fail the tick over it.
    }
    try {
      posters = await generateVideoPosterBatch(admin, 4);
    } catch {
      // Poster generation is best-effort (ffmpeg may be unavailable).
    }
    try {
      docText = await extractDocumentTextBatch(admin, 6);
    } catch {
      // Document text extraction is best-effort.
    }
  }

  return NextResponse.json({
    ok: true,
    claimed: jobs?.length ?? 0,
    processed,
    thumbnails,
    posters,
    docText,
  });
}

async function processJob(admin: Admin, job: JobRow, worker: string, deadline: number) {
  const { data: account } = await admin
    .from('connector_accounts')
    .select('*')
    .eq('id', job.connector_account_id ?? '')
    .maybeSingle();
  if (!account) return finishJob(admin, job.id, 'failed', 'connector account gone');

  const live = getLiveProvider(account.connector_key);
  const port = getPortabilityProvider(account.connector_key);
  const provider = live ?? port;
  if (!provider) return finishJob(admin, job.id, 'failed', 'provider not configured');

  let accessToken: string;
  try {
    accessToken = await getAccessToken(admin, account.id, provider);
  } catch {
    // Authorization problem → action required; retry in an hour.
    await admin
      .from('connector_accounts')
      .update({ status: 'action_required' })
      .eq('id', account.id);
    return requeue(admin, job.id, 3_600_000);
  }

  const storage = new SupabaseStorageProvider(admin);

  // Portability providers (TikTok): async request → poll → download → parse.
  if (port)
    return portabilityFlow(
      admin,
      job,
      account,
      port.makePortabilityClient(),
      accessToken,
      storage,
      deadline,
    );

  const source = live!.makeSourceClient();
  const cursor = ((job.cursor as Record<string, unknown> | null) ?? {}) as {
    discoveryDone?: boolean;
    pageCursor?: string;
    syncCursor?: string | null;
    incrementalCursor?: string;
    changesSeeded?: boolean;
  };

  const seed = async (
    items: {
      sourceItemId: string;
      etag?: string;
      filename: string;
      mimeType: string;
      sizeBytes: number;
    }[],
  ) => {
    if (!items.length) return;
    await admin.from('archive_job_items').upsert(
      items.map((it) => ({
        job_id: job.id,
        user_id: job.user_id,
        connector_account_id: account.id,
        source_item_id: it.sourceItemId,
        source_etag: it.etag ?? null,
        filename: it.filename,
        mime_type: it.mimeType,
        size_bytes: it.sizeBytes,
      })),
      { onConflict: 'job_id,source_item_id', ignoreDuplicates: true },
    );
  };

  try {
    if (job.job_type === 'incremental_import') {
      // Seed only new/changed items since the stored cursor; retain deleted ones.
      if (!cursor.changesSeeded) {
        const changes = await source.getChanges(accessToken, cursor.incrementalCursor ?? '');
        await seed(changes.added);
        for (const sid of changes.deletedSourceItemIds) {
          await admin
            .from('archive_item_sources')
            .update({ source_deleted_at: new Date().toISOString() })
            .eq('connector_account_id', account.id)
            .eq('source_item_id', sid)
            .is('source_deleted_at', null);
        }
        cursor.incrementalCursor = changes.nextCursor;
        cursor.changesSeeded = true;
        await admin.from('archive_jobs').update({ cursor }).eq('id', job.id);
      }
    } else if (!cursor.discoveryDone) {
      // Phase A — full discovery: page the source and seed per-file work rows.
      // Capture the incremental cursor at the start where the provider needs it.
      if (cursor.syncCursor === undefined && !cursor.pageCursor && source.initialSyncCursor) {
        try {
          cursor.syncCursor = (await source.initialSyncCursor(accessToken)) ?? null;
        } catch {
          cursor.syncCursor = null;
        }
      }
      while (Date.now() < deadline) {
        const page = await source.listPage(accessToken, cursor.pageCursor);
        await seed(page.items);
        cursor.pageCursor = page.nextCursor;
        if (page.done) {
          cursor.discoveryDone = true;
          // For Dropbox/OneDrive the final crawl cursor doubles as the sync cursor.
          if (cursor.syncCursor == null) cursor.syncCursor = page.nextCursor ?? null;
        }
        await admin.from('archive_jobs').update({ cursor }).eq('id', job.id);
        if (page.done) break;
      }
      if (!cursor.discoveryDone) return requeue(admin, job.id, 2000);
    }
  } catch (e) {
    return handleJobError(admin, job, e);
  }

  // Phase B — a continuous pool of slots. Each slot independently claims and
  // processes ONE item at a time, so a single large or slow file only occupies
  // its own slot and never stalls the others: throughput is latency-hidden
  // instead of gated by the slowest file in a batch. A per-item timeout (inside
  // processItem) frees a slot from a hung download; the item is retried later
  // (claim_job_items reclaims its lease). Reaching here with work to do is real
  // progress, so the stale-reclaim attempts counter is cleared once — a large
  // import spanning many ticks must never be mistaken for a poison job (§69).
  const CONCURRENCY = 20;
  let clearedAttempts = false;
  const slot = async () => {
    while (Date.now() < deadline) {
      const { data: claimed } = await admin.rpc('claim_job_items', {
        p_job: job.id,
        p_limit: 1,
        p_worker: worker,
      });
      const it = ((claimed ?? []) as ItemRow[])[0];
      if (!it) return; // queue drained for now
      if (!clearedAttempts) {
        clearedAttempts = true;
        await admin.from('archive_jobs').update({ attempts: 0 }).eq('id', job.id);
      }
      await processItem(admin, storage, source, accessToken, account, it);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, () => slot()));

  const { count } = await admin
    .from('archive_job_items')
    .select('id', { count: 'exact', head: true })
    .eq('job_id', job.id)
    .in('status', ['pending', 'failed', 'running']);

  if ((count ?? 0) > 0) return requeue(admin, job.id, 5000);

  const nextCursor =
    job.job_type === 'incremental_import'
      ? cursor.incrementalCursor
      : (cursor.syncCursor ?? undefined);
  return completeJob(admin, job, account, nextCursor ?? undefined);
}

function frequencyMs(freq: string): number {
  if (freq === 'weekly') return 7 * 24 * 3_600_000;
  if (freq === 'monthly') return 30 * 24 * 3_600_000;
  return 24 * 3_600_000; // daily default
}

/** Schedule the next incremental sync by enqueueing a future job (self-perpetuating). */
async function scheduleIncremental(
  admin: Admin,
  job: JobRow,
  account: AccountRow,
  syncCursor: string,
) {
  await admin.from('archive_jobs').insert({
    user_id: job.user_id,
    connector_account_id: account.id,
    job_type: 'incremental_import',
    status: 'queued',
    run_at: new Date(Date.now() + frequencyMs(account.archive_frequency)).toISOString(),
    cursor: { incrementalCursor: syncCursor },
  });
}

/**
 * Store bytes as an archived item: SHA-256 → durable storage → dedup on
 * (owner, checksum) → retain the source relationship. Shared by live and
 * portability flows. Returns the storage key.
 */
async function archiveBytes(
  admin: Admin,
  storage: SupabaseStorageProvider,
  account: AccountRow,
  sourceItemId: string,
  filename: string,
  mimeType: string,
  bytes: Uint8Array,
): Promise<string> {
  const checksum = sha256Hex(bytes);
  const key = contentStorageKey(account.user_id, checksum);
  await storage.put(key, bytes, { contentType: mimeType, checksumSha256: checksum });

  const { data: existing } = await admin
    .from('archive_items')
    .select('id')
    .eq('owner_id', account.user_id)
    .eq('checksum_sha256', checksum)
    .maybeSingle();

  let archiveItemId = existing?.id;
  if (!archiveItemId) {
    const { data: inserted } = await admin
      .from('archive_items')
      .insert({
        owner_id: account.user_id,
        type: archiveTypeFromMime(mimeType),
        original_filename: filename,
        mime_type: mimeType,
        file_size: bytes.byteLength,
        checksum_sha256: checksum,
        archived_at: new Date().toISOString(),
        storage_provider: 'supabase',
        storage_key: key,
        status: 'archived',
      })
      .select('id')
      .single();
    archiveItemId = inserted?.id;
  }
  if (archiveItemId) {
    await admin.from('archive_item_sources').upsert(
      {
        archive_item_id: archiveItemId,
        connector_account_id: account.id,
        source_item_id: sourceItemId,
      },
      { onConflict: 'archive_item_id,connector_account_id,source_item_id', ignoreDuplicates: true },
    );
  }
  return key;
}

/**
 * Portability flow (TikTok): a small state machine across ticks. The user may
 * close the browser; each phase persists in the job cursor and resumes.
 */
async function portabilityFlow(
  admin: Admin,
  job: JobRow,
  account: AccountRow,
  client: PortabilityClient,
  accessToken: string,
  storage: SupabaseStorageProvider,
  deadline: number,
) {
  const cursor = ((job.cursor as Record<string, unknown> | null) ?? {}) as {
    phase?: 'request' | 'poll' | 'download';
    requestId?: string;
  };
  const save = () => admin.from('archive_jobs').update({ cursor }).eq('id', job.id);

  try {
    if (!cursor.phase || cursor.phase === 'request') {
      cursor.requestId = await client.requestExport(accessToken);
      cursor.phase = 'poll';
      await save();
      return requeue(admin, job.id, 60_000); // give the provider time to prepare
    }
    if (cursor.phase === 'poll') {
      const status = await client.checkStatus(accessToken, cursor.requestId!);
      if (status.failed) {
        cursor.phase = 'request';
        delete cursor.requestId;
        await save();
        return requeue(admin, job.id, 5_000);
      }
      if (!status.ready) return requeue(admin, job.id, 60_000);
      cursor.phase = 'download';
      await save();
    }
    if (cursor.phase === 'download') {
      const zip = await client.downloadExport(accessToken, cursor.requestId!);
      const entries = await listZipEntries(zip);
      const { importer } = detectImporter(entries);
      const { items } = importer.parse(await readZipSafely(zip));
      for (const it of items) {
        if (Date.now() >= deadline) return requeue(admin, job.id, 5_000);
        await archiveBytes(
          admin,
          storage,
          account,
          it.sourceItemId,
          it.filename,
          it.mimeType,
          it.bytes,
        );
      }
    }
  } catch (e) {
    return handleJobError(admin, job, e);
  }

  await finishJob(admin, job.id, 'completed');
  await admin
    .from('connector_accounts')
    .update({ status: 'connected', last_successful_archive_at: new Date().toISOString() })
    .eq('id', account.id);
  // Schedule the next export, honouring at least a 24h interval (§7).
  await admin.from('archive_jobs').insert({
    user_id: job.user_id,
    connector_account_id: account.id,
    job_type: 'initial_import',
    status: 'queued',
    run_at: new Date(
      Date.now() + Math.max(frequencyMs(account.archive_frequency), 24 * 3_600_000),
    ).toISOString(),
  });
}

async function processItem(
  admin: Admin,
  storage: SupabaseStorageProvider,
  source: LiveSourceClient,
  accessToken: string,
  account: AccountRow,
  item: ItemRow,
) {
  try {
    const bytes = await withTimeout(
      source.fetchContent(accessToken, {
        sourceItemId: item.source_item_id,
        filename: item.filename ?? 'bestand',
        mimeType: item.mime_type ?? 'application/octet-stream',
        sizeBytes: Number(item.size_bytes ?? 0),
      }),
      90_000,
      'download timed out',
    );
    const key = await archiveBytes(
      admin,
      storage,
      account,
      item.source_item_id,
      item.filename ?? 'bestand',
      item.mime_type ?? 'application/octet-stream',
      bytes,
    );
    await admin
      .from('archive_job_items')
      .update({ status: 'done', storage_key: key, last_error: null })
      .eq('id', item.id);
  } catch (e) {
    await handleItemFailure(admin, item, e);
  }
}

async function handleItemFailure(admin: Admin, item: ItemRow, e: unknown) {
  const kind = e instanceof LiveSourceError ? e.kind : 'transient';
  // Only an authoritative per-file 404 while the provider is otherwise healthy
  // counts as a source deletion (soft). Everything else retries — an outage is
  // NEVER a deletion (CLAUDE.md §4).
  if (kind === 'not_found') {
    await admin.from('archive_job_items').update({ status: 'deleted' }).eq('id', item.id);
    return;
  }
  if (kind === 'permanent') {
    await admin
      .from('archive_job_items')
      .update({ status: 'failed', last_error: String((e as Error).message).slice(0, 500) })
      .eq('id', item.id);
    return;
  }
  // rate_limit / transient / auth → retry with backoff (dead-letter after MAX).
  const attempts = item.attempts;
  const retryAfter =
    e instanceof LiveSourceError && e.retryAfterMs ? e.retryAfterMs : backoffMs(attempts);
  const next = new Date(Date.now() + retryAfter).toISOString();
  await admin
    .from('archive_job_items')
    .update({
      status: attempts >= MAX_ATTEMPTS ? 'dead' : 'failed',
      next_attempt_at: next,
      last_error: String((e as Error).message).slice(0, 500),
    })
    .eq('id', item.id);
}

async function handleJobError(admin: Admin, job: JobRow, e: unknown) {
  const kind = e instanceof LiveSourceError ? e.kind : 'transient';
  if (kind === 'auth') {
    return requeue(admin, job.id, 3_600_000);
  }
  const retryAfter =
    e instanceof LiveSourceError && e.retryAfterMs ? e.retryAfterMs : backoffMs(job.attempts);
  return requeue(admin, job.id, retryAfter);
}

async function requeue(admin: Admin, jobId: string, delayMs: number) {
  await admin
    .from('archive_jobs')
    .update({
      status: 'queued',
      claimed_at: null,
      claimed_by: null,
      run_at: new Date(Date.now() + delayMs).toISOString(),
    })
    .eq('id', jobId);
}

async function finishJob(
  admin: Admin,
  jobId: string,
  status: 'completed' | 'failed',
  error?: string,
) {
  await admin
    .from('archive_jobs')
    .update({ status, completed_at: new Date().toISOString(), last_error: error ?? null })
    .eq('id', jobId);
}

async function completeJob(admin: Admin, job: JobRow, account: AccountRow, syncCursor?: string) {
  await finishJob(admin, job.id, 'completed');
  await admin
    .from('connector_accounts')
    .update({ status: 'connected', last_successful_archive_at: new Date().toISOString() })
    .eq('id', account.id);
  // Keep the source fresh: schedule the next incremental sync (§7). Self-
  // perpetuating via the queue — no separate scheduler needed for the loop.
  if (syncCursor) await scheduleIncremental(admin, job, account, syncCursor);
}
