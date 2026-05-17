import { ReactNode } from 'react';
import { BackToTop } from '@/components/BackToTop';
import { LeftSidebar } from '@/components/LeftSidebar';
import { BottomNav } from '@/components/BottomNav';

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  wide?: boolean;
}

export function Layout({ children, sidebar, wide }: LayoutProps) {
  return (
    <>
      <div className="min-h-[calc(100vh-3.5rem)] max-w-screen-2xl mx-auto">
        <div className="flex">
          {/* Left sidebar — fixed, always visible on lg+ */}
          <div className="hidden lg:block w-56 xl:w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-border bg-card/40">
            <LeftSidebar />
          </div>

          {/* Center feed */}
          <main className={`flex-1 min-w-0 py-4 sm:py-5 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] lg:pb-5 ${
            wide
              ? 'px-4 sm:px-6 lg:px-8'
              : 'px-3 sm:px-5 max-w-3xl mx-auto'
          }`}>
            {children}
          </main>

          {/* Right sidebar — optional, per-page */}
          {sidebar && (
            <aside className="hidden xl:block w-72 2xl:w-80 shrink-0 px-4 py-5">
              <div className="sticky top-[calc(3.5rem+1.25rem)] space-y-5">
                {sidebar}
              </div>
            </aside>
          )}
        </div>
        <BackToTop />
      </div>

      {/* Mobile bottom nav — hidden on lg+ */}
      <BottomNav />
    </>
  );
}
