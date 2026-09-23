import { NextResponse, type NextRequest } from 'next/server';
import { bearerContext, type BearerContext } from '@/lib/supabase/bearer';
import { rateLimit } from '@/lib/security/rate-limit';
import { MobileError } from './handlers';

/**
 * Wrap a mobile POST handler: authenticate the Bearer token, parse the JSON
 * body, run the handler, and map typed {@link MobileError}s to safe JSON
 * responses. Never leaks internal/provider detail to the client (§51).
 */
export function mobilePost(
  run: (ctx: BearerContext, body: Record<string, unknown>) => Promise<unknown>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const ctx = await bearerContext(request);
    if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    // Per-device throttle so a leaked token can't hammer the API.
    const limited = rateLimit(`mobile:${ctx.userId}`, 120, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429, headers: { 'retry-after': String(limited.retryAfter) } },
      );
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }
    const body = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

    try {
      const result = await run(ctx, body);
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof MobileError) {
        return NextResponse.json({ error: error.code }, { status: error.status });
      }
      return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
  };
}
