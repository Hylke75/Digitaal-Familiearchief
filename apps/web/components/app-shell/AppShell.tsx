import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

/** Authenticated application shell (docs/DESIGN.md §6–§7). */
export function AppShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  return (
    <div className="max-w-shell bg-warm mx-auto flex min-h-dvh">
      <a
        href="#main-content"
        className="bg-forest focus:ring-forest rounded-pill sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-offset-2"
      >
        Naar inhoud
      </a>
      <Sidebar userName={userName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main-content" className="flex-1 px-5 pb-24 pt-6 sm:px-8 lg:pb-10">
          <div className="max-w-content mx-auto w-full">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
