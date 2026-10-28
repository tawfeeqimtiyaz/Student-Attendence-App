import React from 'react';
import { Compass } from 'lucide-react';
import { Role } from '@college-erp/shared';
import { useAuthStore } from '../../stores/auth.store';
import { getDashboardRoute } from '../../components/shared/RoleGate';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/States';
import { ButtonLink } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  return (
    <Card className="mx-auto mt-8 max-w-lg">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist or may have moved."
        action={
          <ButtonLink to={getDashboardRoute(user?.role as Role)} variant="primary">
            Back to dashboard
          </ButtonLink>
        }
      />
    </Card>
  );
};
