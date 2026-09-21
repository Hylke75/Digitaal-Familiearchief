import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureConnectorAccount, findClient, issueAuthCode } from '@/lib/meta-eyi/store';

export const runtime = 'nodejs';

/**
 * GET /api/meta/oauth/authorize — Bewora's authorization endpoint. Meta sends the
 * (Bewora-logged-in) user here; we validate the client + EXACT redirect_uri,
 * ensure a connector account, issue a single-use code and redirect back to Meta.
 * The code only ever travels to Meta's pre-registered redirect, so there is no
 * open-redirect/CSRF exfiltration path.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id') ?? '';
  const redirectUri = searchParams.get('redirect_uri') ?? '';
  const state = searchParams.get('state') ?? '';
  const source = searchParams.get('source') === 'instagram' ? 'instagram' : 'facebook';

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      new URL(`/inloggen?next=${encodeURIComponent(request.url)}`, request.url),
    );
  }

  const admin = createAdminClient();
  const client = await findClient(admin, clientId);
  if (!client || !client.redirectUris.includes(redirectUri)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const connectorAccountId = await ensureConnectorAccount(admin, user.id, source);
  const code = await issueAuthCode(admin, {
    clientId,
    userId: user.id,
    connectorAccountId,
    redirectUri,
    scope: 'photos videos posts',
  });

  const back = new URL(redirectUri);
  back.searchParams.set('code', code);
  if (state) back.searchParams.set('state', state);
  return NextResponse.redirect(back.toString());
}
