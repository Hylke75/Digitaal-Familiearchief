import type { EncryptedSecret, TokenEncryption } from './index';

/**
 * Provider credentials (OAuth refresh tokens etc.) — the ONLY place they live
 * (CONNECTORS_BUILD.md §13). Application code must go through this store and
 * never read raw token columns. Values are encrypted at rest via
 * {@link TokenEncryption}; plaintext is never logged or returned except by an
 * explicit `retrieve`.
 */
export interface ProviderCredential {
  connectorAccountId: string;
  /** e.g. 'refresh_token', 'access_token'. */
  kind: string;
}

/** Backend that persists opaque encrypted blobs, keyed by account + kind. */
export interface EncryptedCredentialBackend {
  put(connectorAccountId: string, kind: string, secret: EncryptedSecret): Promise<void>;
  get(connectorAccountId: string, kind: string): Promise<EncryptedSecret | null>;
  remove(connectorAccountId: string, kind: string): Promise<void>;
  removeAll(connectorAccountId: string): Promise<void>;
}

export interface ProviderCredentialStore {
  save(connectorAccountId: string, kind: string, plaintext: string): Promise<void>;
  retrieve(connectorAccountId: string, kind: string): Promise<string | null>;
  rotate(connectorAccountId: string, kind: string, newPlaintext: string): Promise<void>;
  revoke(connectorAccountId: string, kind: string): Promise<void>;
  delete(connectorAccountId: string): Promise<void>;
}

export function createCredentialStore(
  encryption: TokenEncryption,
  backend: EncryptedCredentialBackend,
): ProviderCredentialStore {
  return {
    async save(connectorAccountId, kind, plaintext) {
      const secret = await encryption.encrypt(plaintext);
      await backend.put(connectorAccountId, kind, secret);
    },
    async retrieve(connectorAccountId, kind) {
      const secret = await backend.get(connectorAccountId, kind);
      return secret ? encryption.decrypt(secret) : null;
    },
    async rotate(connectorAccountId, kind, newPlaintext) {
      const secret = await encryption.encrypt(newPlaintext);
      await backend.put(connectorAccountId, kind, secret);
    },
    async revoke(connectorAccountId, kind) {
      await backend.remove(connectorAccountId, kind);
    },
    async delete(connectorAccountId) {
      await backend.removeAll(connectorAccountId);
    },
  };
}

/** In-memory backend for tests (never for production). */
export class InMemoryCredentialBackend implements EncryptedCredentialBackend {
  private readonly store = new Map<string, EncryptedSecret>();
  private key(a: string, k: string) {
    return `${a}::${k}`;
  }
  async put(a: string, k: string, secret: EncryptedSecret) {
    this.store.set(this.key(a, k), secret);
  }
  async get(a: string, k: string) {
    return this.store.get(this.key(a, k)) ?? null;
  }
  async remove(a: string, k: string) {
    this.store.delete(this.key(a, k));
  }
  async removeAll(a: string) {
    for (const key of [...this.store.keys()]) {
      if (key.startsWith(`${a}::`)) this.store.delete(key);
    }
  }
}
