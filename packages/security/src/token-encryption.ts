import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { EncryptedSecret, TokenEncryption } from './index';

/**
 * AES-256-GCM authenticated encryption for provider credentials at rest
 * (CONNECTORS_BUILD.md §13). The data key lives OUTSIDE the database (env /
 * future KMS). The `scheme` tag carries the algorithm + key version so keys can
 * be rotated without ambiguity. Ciphertext is `base64(iv || authTag || data)`.
 */
const SCHEME = 'aesgcm-256.v1';
const IV_BYTES = 12;
const TAG_BYTES = 16;

export function decodeKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must decode to 32 bytes (base64-encoded AES-256 key)');
  }
  return key;
}

export class AesGcmTokenEncryption implements TokenEncryption {
  constructor(private readonly key: Buffer) {
    if (key.length !== 32) throw new Error('AES-256 key must be 32 bytes');
  }

  static fromBase64(base64Key: string): AesGcmTokenEncryption {
    return new AesGcmTokenEncryption(decodeKey(base64Key));
  }

  async encrypt(plaintext: string): Promise<EncryptedSecret> {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      scheme: SCHEME,
      ciphertext: Buffer.concat([iv, tag, enc]).toString('base64'),
    };
  }

  async decrypt(secret: EncryptedSecret): Promise<string> {
    if (secret.scheme !== SCHEME) {
      throw new Error(`Unsupported encryption scheme: ${secret.scheme}`);
    }
    const raw = Buffer.from(secret.ciphertext, 'base64');
    const iv = raw.subarray(0, IV_BYTES);
    const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const data = raw.subarray(IV_BYTES + TAG_BYTES);
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
