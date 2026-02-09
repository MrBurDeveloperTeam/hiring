import { ReactNode } from 'react';
import { TopNav } from '../components/TopNav';
import { Footer } from '../components/Footer';
import { cn } from '../lib/utils';

interface AppShellProps {
  children: ReactNode;
  sidebar?: ReactNode;
  padded?: boolean;
  maxWidth?: boolean;
  showFooter?: boolean;
  background?: 'light' | 'muted';
}

export function AppShell({
  children,
  sidebar,
  padded = true,
  maxWidth = true,
  showFooter = true,
  background = 'light'
}: AppShellProps) {
  return (
    <div className={cn('min-h-screen', background === 'muted' ? 'bg-gray-50' : 'bg-white')}>
      <TopNav />
      <main
        className={cn(
          padded ? 'py-6 md:py-10' : '',
          sidebar ? 'container-wide' : maxWidth ? 'container-wide' : 'w-full'
        )}
      >
        {sidebar ? (
          <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
            <aside className="hidden lg:block">{sidebar}</aside>
            <section>{children}</section>
          </div>
        ) : (
          children
        )}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
