import { describe, expect, it } from 'vitest';
import { redactSecrets } from './index';

describe('@dla/security redaction', () => {
  it('redacts sensitive keys before logging', () => {
    const out = redactSecrets({
      userId: 'u1',
      connector_key: 'google_drive',
      refresh_token: 'secret-value',
      Authorization: 'Bearer x',
    });
    expect(out.userId).toBe('u1');
    expect(out.connector_key).toBe('google_drive');
    expect(out.refresh_token).toBe('[redacted]');
    expect(out.Authorization).toBe('[redacted]');
  });
});
