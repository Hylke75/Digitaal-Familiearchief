import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell/AppShell';
import { DemoBanner } from '@/components/app-shell/DemoBanner';
import { createClient } from '@/lib/supabase/server';
import { isDemoUser } from '@/lib/demo-account';

/**
 * Authenticated area layout. The middleware already redirects anonymous users,
 * but we re-check here (defence in depth) and load the user's display name for
 * the shell. RLS ensures the profile query only returns the caller's own row.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/inloggen');

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .maybeSingle();

  const userName = profile?.first_name?.trim() || user.email?.split('@')[0] || 'Jij';

  return (
    <AppShell userName={userName}>
      {isDemoUser(user.id) ? <DemoBanner /> : null}
      {children}
    </AppShell>
  );
}
