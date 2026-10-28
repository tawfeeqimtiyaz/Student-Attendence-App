// ============================================
// Role Gate — Only renders children if user has required role
// ============================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { Role } from '@college-erp/shared';
import { ROUTES } from '../../constants/routes';
import { ROLE_LABELS } from '../../constants/navigation';
import { EmptyState } from '../ui/States';
import { ButtonLink } from '../ui/Button';
import { Card } from '../ui/Card';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export const RoleGate: React.FC<RoleGateProps> = ({ children, allowedRoles }) => {
  const { user } = useAuthStore();

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

  if (!allowedRoles.includes(user.role as Role)) {
    return <AccessDenied role={user.role as Role} />;
  }

  return <>{children}</>;
};

/** Shown in place of a page the signed-in role may not open. */
export function AccessDenied({ role }: { role: Role }) {
  return (
    <Card className="mx-auto mt-8 max-w-lg">
      <EmptyState
        icon={ShieldX}
        title="You don't have access to this page"
        description={`This area isn't available to ${ROLE_LABELS[role].toLowerCase()} accounts. If you think this is a mistake, contact your administrator.`}
        action={
          <ButtonLink to={getDashboardRoute(role)} variant="primary">
            Go to your dashboard
          </ButtonLink>
        }
      />
    </Card>
  );
}

function getDashboardRoute(role?: Role): string {
  switch (role) {
    case Role.ADMIN:
      return ROUTES.ADMIN_DASHBOARD;
    case Role.FACULTY:
      return ROUTES.FACULTY_DASHBOARD;
    case Role.STUDENT:
      return ROUTES.STUDENT_DASHBOARD;
    default:
      return ROUTES.LOGIN;
  }
}

export { getDashboardRoute };
