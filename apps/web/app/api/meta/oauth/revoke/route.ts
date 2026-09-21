import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { findClient, revokeByRefreshToken } from '@/lib/meta-eyi/store';
import { verifyToken } from '@/lib/meta-eyi/tokens';

export const runtime = 'nodejs';

/** POST /api/meta/oauth/revoke — revoke a refresh token (RFC 7009 style). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const admin = createAdminClient();
  const client = await findClient(admin, String(form.get('client_id') ?? ''));
  if (!client || !verifyToken(String(form.get('client_secret') ?? ''), client.clientSecretHash)) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
  }

  const token = String(form.get('token') ?? '');
  if (token) await revokeByRefreshToken(admin, token);
  // RFC 7009: return 200 regardless of whether the token existed.
  return new NextResponse(null, { status: 200 });
}
