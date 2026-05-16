import { ReactNode } from 'react';
import { BackToTop } from '@/components/BackToTop';

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export function Layout({ children, sidebar }: LayoutProps) {
  return (
    <div className="container px-0 sm:px-4 py-4 sm:py-8">
      <div className={sidebar ? 'grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8' : ''}>
        <main className="px-0 sm:px-0">{children}</main>
        {sidebar && <aside className="hidden lg:block px-0 sm:px-0"><div className="sticky top-24 space-y-6">{sidebar}</div></aside>}
      </div>
      <BackToTop />
    </div>
  );
}
