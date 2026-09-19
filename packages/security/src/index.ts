/**
 * @dla/security — security primitives and contracts (CLAUDE.md §45–§47).
 *
 * Phase 0 defines interfaces only. Concrete token encryption is implemented in a
 * later phase together with a documented key-management strategy. Provider
 * tokens are NEVER stored as plaintext and NEVER logged.
 */

/** Auditable security events (CLAUDE.md §47). Never carries private content. */
export type SecurityAuditEventType =
  | 'login'
  | 'logout'
  | 'connector_connected'
  | 'connector_disconnected'
  | 'connector_reauthorised'
  | 'archive_export_requested'
  | 'archive_export_downloaded'
  | 'account_deletion_requested'
  | 'security_setting_changed';

export interface SecurityAuditEvent {
  type: SecurityAuditEventType;
  userId: string;
  /** Non-sensitive context only (e.g. connector_key, job_id). Never tokens/content. */
  context?: Record<string, string | number | boolean>;
  occurredAt: string;
}

/** Ciphertext envelope; the wrapped bytes are opaque and must never be logged. */
export interface EncryptedSecret {
  /** Algorithm/version tag to allow key rotation without ambiguity. */
  scheme: string;
  ciphertext: string;
}

/**
 * Encrypts sensitive provider credentials (e.g. OAuth refresh tokens) at rest.
 * Implementations must support key rotation and never expose plaintext in logs.
 */
export interface TokenEncryption {
  encrypt(plaintext: string): Promise<EncryptedSecret>;
  decrypt(secret: EncryptedSecret): Promise<string>;
}

/**
 * Guard to keep secrets out of structured logs. Matches sensitive substrings
 * (token/secret/password/authorization/cookie/credential) plus specific key-name
 * shapes, while deliberately NOT redacting plain identifiers such as
 * `connector_key`.
 */
export function redactSecrets<T extends Record<string, unknown>>(input: T): T {
  const SENSITIVE_SUBSTRING = /(token|secret|password|passwd|authorization|cookie|credential)/i;
  const SENSITIVE_KEY_NAME = /^(key|api[_-]?key|encryption[_-]?key|secret[_-]?key)$/i;
  const out = { ...input };
  for (const k of Object.keys(out)) {
    if (SENSITIVE_SUBSTRING.test(k) || SENSITIVE_KEY_NAME.test(k)) {
      (out as Record<string, unknown>)[k] = '[redacted]';
    }
  }
  return out;
}

export * from './token-encryption';
export * from './credential-store';
export * from './oauth';
