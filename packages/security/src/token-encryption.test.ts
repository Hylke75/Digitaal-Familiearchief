import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AesGcmTokenEncryption } from './token-encryption';
import { InMemoryCredentialBackend, createCredentialStore } from './credential-store';

const keyB64 = randomBytes(32).toString('base64');

describe('AesGcmTokenEncryption', () => {
  it('round-trips a secret and never stores plaintext', async () => {
    const enc = AesGcmTokenEncryption.fromBase64(keyB64);
    const secret = await enc.encrypt('refresh-token-123');
    expect(secret.scheme).toBe('aesgcm-256.v1');
    expect(secret.ciphertext).not.toContain('refresh-token-123');
    expect(await enc.decrypt(secret)).toBe('refresh-token-123');
  });

  it('produces a unique ciphertext each time (random IV)', async () => {
    const enc = AesGcmTokenEncryption.fromBase64(keyB64);
    const a = await enc.encrypt('same');
    const b = await enc.encrypt('same');
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('fails to decrypt tampered ciphertext (authenticated)', async () => {
    const enc = AesGcmTokenEncryption.fromBase64(keyB64);
    const secret = await enc.encrypt('secret');
    const tampered = { ...secret, ciphertext: 'AAAA' + secret.ciphertext.slice(4) };
    await expect(enc.decrypt(tampered)).rejects.toBeTruthy();
  });

  it('rejects a wrong-length key', () => {
    expect(() =>
      AesGcmTokenEncryption.fromBase64(Buffer.from('short').toString('base64')),
    ).toThrow();
  });
});

describe('ProviderCredentialStore', () => {
  it('saves, retrieves, rotates, revokes and deletes credentials', async () => {
    const store = createCredentialStore(
      AesGcmTokenEncryption.fromBase64(keyB64),
      new InMemoryCredentialBackend(),
    );
    await store.save('acc-1', 'refresh_token', 'tok-1');
    expect(await store.retrieve('acc-1', 'refresh_token')).toBe('tok-1');

    await store.rotate('acc-1', 'refresh_token', 'tok-2');
    expect(await store.retrieve('acc-1', 'refresh_token')).toBe('tok-2');

    await store.revoke('acc-1', 'refresh_token');
    expect(await store.retrieve('acc-1', 'refresh_token')).toBeNull();

    await store.save('acc-1', 'a', 'x');
    await store.save('acc-1', 'b', 'y');
    await store.delete('acc-1');
    expect(await store.retrieve('acc-1', 'a')).toBeNull();
    expect(await store.retrieve('acc-1', 'b')).toBeNull();
  });
});
