import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/** Focused, full-screen onboarding (docs/DESIGN.md §10) — no app sidebar. */
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/inloggen');

  return (
    <div className="bg-warm min-h-dvh">
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}
