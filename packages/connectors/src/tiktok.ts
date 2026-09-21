import { LiveSourceError } from './live';
import type { Fetcher } from './dropbox';
import type { PortabilityClient, PortabilityStatus } from './portability';

const BASE = 'https://open.tiktokapis.com/v2/user/data';

/**
 * TikTok Data Portability connector (verified 2026-09-19; see docs/connectors/tiktok.md).
 * add → check → download official export (posts + profile). EEA/UK only; requires
 * TikTok's privacy + security review. Exports may return the full dataset, so the
 * archive engine dedups by SHA-256 — no duplicate media on repeated exports.
 */
export class TikTokPortabilityClient implements PortabilityClient {
  readonly connectorKey = 'tiktok';
  constructor(private readonly fetchImpl: Fetcher) {}

  private async post(
    path: string,
    token: string,
    body: unknown,
  ): Promise<{
    data?: Record<string, unknown>;
    error?: { code?: string; message?: string };
  }> {
    const res = await this.fetchImpl(`${BASE}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await mapError(res);
    return res.json() as Promise<{
      data?: Record<string, unknown>;
      error?: { code?: string; message?: string };
    }>;
  }

  async requestExport(accessToken: string): Promise<string> {
    const out = await this.post('/add/?fields=request_id', accessToken, {
      data_format: 'json',
      category_selection_list: ['video', 'profile'], // posts + profile, no DMs
    });
    const id = out.data?.request_id;
    if (id === undefined || id === null)
      throw new LiveSourceError('permanent', 'TikTok: no request_id');
    return String(id);
  }

  async checkStatus(accessToken: string, requestId: string): Promise<PortabilityStatus> {
    const out = await this.post('/check/?fields=request_id,status', accessToken, {
      request_id: Number(requestId),
    });
    const status = String(out.data?.status ?? 'pending');
    return {
      status,
      ready: status === 'downloading',
      failed: status === 'expired' || status === 'cancelled',
    };
  }

  async downloadExport(accessToken: string, requestId: string): Promise<Uint8Array> {
    const res = await this.fetchImpl(`${BASE}/download/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: Number(requestId) }),
    });
    if (!res.ok) throw await mapError(res);
    return new Uint8Array(await res.arrayBuffer());
  }
}

async function mapError(res: {
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}): Promise<LiveSourceError> {
  const body = await res.text().catch(() => '');
  if (res.status === 429) {
    const ra = Number(res.headers.get('Retry-After'));
    return new LiveSourceError(
      'rate_limit',
      'TikTok rate limited',
      Number.isFinite(ra) ? ra * 1000 : undefined,
    );
  }
  if (res.status === 401) return new LiveSourceError('auth', 'TikTok authorization invalid');
  if (res.status >= 500) return new LiveSourceError('transient', `TikTok ${res.status}`);
  return new LiveSourceError('permanent', `TikTok ${res.status}: ${body.slice(0, 200)}`);
}
