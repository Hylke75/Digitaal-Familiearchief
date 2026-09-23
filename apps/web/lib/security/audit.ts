import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dla/database';

/** Security event types we record (§47). Kept as a union so call sites stay consistent. */
export type AuditEventType =
  | 'login'
  | 'logout'
  | 'archive_export_requested'
  | 'account_deletion_requested'
  | 'connector_connected'
  | 'connector_disconnected'
  | 'connector_reauthorised';

/**
 * Record a security audit event for the current user (§47). Best-effort by
 * design: auditing must never break the user-facing flow, so a failure (e.g. the
 * RPC not yet deployed, or a transient error) is swallowed. Only ever pass
 * operational metadata as context — never private archive content (§49).
 */
export async function auditLog(
  supabase: SupabaseClient<Database>,
  type: AuditEventType,
  context: Record<string, unknown> = {},
): Promise<void> {
  try {
    // Cast: audit_log ships in migration 0013; until types are regenerated
    // against a database that has it, its name isn't in the generated union.
    const rpc = supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<unknown>;
    await rpc('audit_log', { p_type: type, p_context: context });
  } catch {
    // Never surface auditing failures to the caller.
  }
}
