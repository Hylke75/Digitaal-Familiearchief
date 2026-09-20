import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { safeEqual } from '@dla/security';
import { exchangeCode, type FetchLike } from '@dla/oauth';
import { getConnector } from '@dla/connectors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLiveProvider } from '@/lib/connectors/live-providers';
import { encryptRefreshToken } from '@/lib/connectors/token';
import { OAUTH_COOKIE } from '../start/route';

const globalFetch = fetch as unknown as FetchLike;

/**
 * OAuth callback: verify state, exchange the code, store the ENCRYPTED refresh
 * token, create the connector account, and enqueue an initial discovery job.
 * The archived copy stays independent from the provider (CLAUDE.md §4).
 */
export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const provider = params.provider;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const providerError = url.searchParams.get('error');

  const jar = cookies();
  const raw = jar.get(OAUTH_COOKIE)?.value;
  jar.delete(OAUTH_COOKIE);

  const fail = () => NextResponse.redirect(new URL('/bronnen?verbinden=mislukt', request.url));

  if (providerError || !code || !returnedState || !raw) return fail();

  let flow: { provider: string; state: string; codeVerifier: string };
  try {
    flow = JSON.parse(raw);
  } catch {
    return fail();
  }
  if (flow.provider !== provider || !safeEqual(flow.state, returnedState)) return fail();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/inloggen', request.url));

  const lp = getLiveProvider(provider);
  if (!lp) return fail();

  let tokens;
  try {
    tokens = await exchangeCode(
      lp.oauth,
      lp.makeClient(),
      { code, codeVerifier: flow.codeVerifier },
      globalFetch,
    );
  } catch {
    return fail();
  }
  if (!tokens.refreshToken) return fail(); // provider did not grant offline access

  // Create or reuse the connector account (RLS: owner insert).
  const displayName = getConnector(provider)?.displayName ?? provider;
  const { data: existing } = await supabase
    .from('connector_accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('connector_key', provider)
    .maybeSingle();

  let accountId = existing?.id;
  if (!accountId) {
    const { data: created, error } = await supabase
      .from('connector_accounts')
      .insert({
        user_id: user.id,
        connector_key: provider,
        display_name: displayName,
        status: 'connected',
        connected_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error || !created) return fail();
    accountId = created.id;
  }

  // Store the encrypted refresh token via the owner-bound SECURITY DEFINER RPC.
  const secret = await encryptRefreshToken(tokens.refreshToken);
  const { error: credErr } = await supabase.rpc('store_connector_credential', {
    p_connector_account_id: accountId,
    p_kind: lp.credentialKind,
    p_scheme: secret.scheme,
    p_ciphertext: secret.ciphertext,
  });
  if (credErr) return fail();

  // Enqueue the initial discovery job (privileged — worker table). If the service
  // role isn't configured yet, the account is still connected; the scheduler will
  // enqueue later.
  try {
    const admin = createAdminClient();
    await admin.from('archive_jobs').insert({
      user_id: user.id,
      connector_account_id: accountId,
      job_type: 'discovery',
      status: 'queued',
      run_at: new Date().toISOString(),
    });
  } catch {
    // service role missing — non-fatal for the connect step.
  }

  return NextResponse.redirect(new URL('/bronnen?verbinden=gelukt', request.url));
}
