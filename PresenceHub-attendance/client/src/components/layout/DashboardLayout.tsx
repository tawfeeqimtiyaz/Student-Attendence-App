// ============================================
// Dashboard Layout — sidebar + header + page container
// ============================================

import React, { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Role } from '@college-erp/shared';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { UIProvider, useUI } from '../../contexts/UIContext';
import { useAuthStore } from '../../stores/auth.store';
import { findNavEntry } from '../../constants/navigation';
import { cn } from '../../utils/cn';
import { PageSkeleton } from '../ui/States';

function useDocumentTitle() {
  const { pathname } = useLocation();
  const role = useAuthStore((s) => s.user?.role) as Role | undefined;
  useEffect(() => {
    const entry = role ? findNavEntry(role, pathname) : null;
    document.title = entry ? `${entry.item.label} · PresenceHub` : 'PresenceHub';
  }, [pathname, role]);
}

const LayoutInner: React.FC = () => {
  const { isSidebarCollapsed } = useUI();
  const { pathname } = useLocation();
  useDocumentTitle();

  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div
        className={cn(
          'flex min-h-dvh flex-col transition-[padding] duration-200 ease-out',
          isSidebarCollapsed ? 'lg:pl-sidebar-collapsed' : 'lg:pl-sidebar'
        )}
      >
        <Topbar />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-content flex-1 px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<PageSkeleton />}>
            <div key={pathname} className="animate-fade-in">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export const DashboardLayout: React.FC = () => {
  return (
    <UIProvider>
      <LayoutInner />
    </UIProvider>
  );
};
