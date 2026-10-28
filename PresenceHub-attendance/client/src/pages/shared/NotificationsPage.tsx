import React from 'react';
import { Bell } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/States';
import { NotificationItem } from '../../components/student/NotificationItem';

export const NotificationsPage: React.FC = () => {
  // Notifications are delivered through the student dashboard feed (unread, latest five).
  const { data, error, isLoading, reload } = useApiQuery(studentApi.getDashboard, []);
  const notifications = data?.notifications ?? [];

  return (
    <Page>
      <PageHeader title="Notifications" description="Your latest unread announcements and alerts from the institution." />
      <Card flush>
        {isLoading ? (
          <SkeletonRows rows={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up" description="New announcements and alerts will appear here." />
        ) : (
          <ul className="divide-y divide-line">
            {notifications.map((n) => (
              <li key={n.id}>
                <NotificationItem notification={n} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
};
