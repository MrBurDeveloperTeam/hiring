import { ReactNode } from 'react';
import { AppShell } from './AppShell';
import { Sidebar, SidebarLink } from '../components/Sidebar';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useEmployerPoints } from '../contexts/EmployerPointsContext';
import { Plus } from 'lucide-react';

interface DashboardShellProps {
  children: ReactNode;
  sidebarLinks: SidebarLink[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  hideNavigation?: boolean;
  padded?: boolean;
}

export function DashboardShell({
  children,
  sidebarLinks,
  title,
  subtitle,
  actions,
  hideNavigation,
  padded = true
}: DashboardShellProps) {
  const { userRole } = useAuth();
  const { points, addPoints } = useEmployerPoints();

  return (
    <AppShell padded={padded} background="muted" showFooter={false}>
      <div className={cn("flex flex-col", padded && "gap-6")}>
        {!hideNavigation && (
          <Sidebar title="Navigation" links={sidebarLinks} orientation="horizontal" />
        )}
        {(title || actions) && (
          <div className={cn("flex flex-wrap items-start justify-between gap-3", !padded && "px-4 pt-4")}>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              {actions}
              {userRole === 'employer' && (
                <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                  <span className="text-sm font-medium text-gray-600">
                    Credits: <span className="text-brand font-bold">{points}</span>
                  </span>
                  <button
                    onClick={() => addPoints(50)}
                    className="p-1 rounded-full hover:bg-gray-100 text-brand transition-colors"
                    title="Top up credits (Mock)"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {children}
      </div>
    </AppShell>
  );
}
