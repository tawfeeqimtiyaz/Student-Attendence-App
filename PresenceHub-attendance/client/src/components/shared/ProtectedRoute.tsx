// ============================================
// Protected Route — Redirects to login if unauthenticated
// ============================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { ROUTES } from '../../constants/routes';
import { BrandMark } from '../layout/BrandMark';

export function SessionSplash() {
  return (
    <div role="status" className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas">
      <BrandMark className="size-10 rounded-xl" />
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Restoring your session…
      </div>
    </div>
  );
}

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return <SessionSplash />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
