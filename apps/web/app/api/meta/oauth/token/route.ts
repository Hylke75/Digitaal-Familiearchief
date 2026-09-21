import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { exchangeCode, findClient, refreshTokens } from '@/lib/meta-eyi/store';
import { verifyToken } from '@/lib/meta-eyi/tokens';

export const runtime = 'nodejs';

/** POST /api/meta/oauth/token — Bewora's token endpoint (Meta is the client). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const clientId = String(form.get('client_id') ?? '');
  const clientSecret = String(form.get('client_secret') ?? '');
  const grantType = String(form.get('grant_type') ?? '');

  const admin = createAdminClient();
  const client = await findClient(admin, clientId);
  if (!client || !verifyToken(clientSecret, client.clientSecretHash)) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
  }

  const reply = (r: { accessToken: string; refreshToken: string; expiresIn: number }) =>
    NextResponse.json({
      access_token: r.accessToken,
      refresh_token: r.refreshToken,
      token_type: 'Bearer',
      expires_in: r.expiresIn,
    });

  if (grantType === 'authorization_code') {
    const r = await exchangeCode(admin, {
      code: String(form.get('code') ?? ''),
      clientId,
      redirectUri: String(form.get('redirect_uri') ?? ''),
    });
    return 'error' in r ? NextResponse.json(r, { status: 400 }) : reply(r);
  }
  if (grantType === 'refresh_token') {
    const r = await refreshTokens(admin, {
      refreshToken: String(form.get('refresh_token') ?? ''),
      clientId,
    });
    return 'error' in r ? NextResponse.json(r, { status: 400 }) : reply(r);
  }
  return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
}
