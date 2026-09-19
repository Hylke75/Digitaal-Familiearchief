import { AppShell } from '@/components/app-shell/AppShell';
import { MOCK_USER } from '@/lib/mock-dashboard';

/**
 * Authenticated area layout. Auth-gating (redirect anonymous users) is added in
 * the auth phase; for now it renders the shell with a placeholder user so the
 * design system and screens can be built and reviewed.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell userName={MOCK_USER.name}>{children}</AppShell>;
}
