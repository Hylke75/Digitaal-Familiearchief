import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

/** Authenticated application shell (docs/DESIGN.md §6–§7). */
export function AppShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  return (
    <div className="max-w-shell bg-warm mx-auto flex min-h-dvh">
      <Sidebar userName={userName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-5 pb-24 pt-6 sm:px-8 lg:pb-10">
          <div className="max-w-content mx-auto w-full">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
