import React, { useMemo } from 'react';
import { ArrowRight, Bell, CalendarCheck, ClipboardCheck, FileText, GraduationCap, Wallet } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useAuthStore } from '../../stores/auth.store';
import { ROUTES } from '../../constants/routes';
import { overallCounts, presentRate, summarizeByCourse } from '../../utils/attendance';
import { formatCurrency, formatDate, formatNumber, formatPercent, humanize } from '../../utils/format';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/Stats';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/ui/States';
import { CourseAttendanceList } from '../../components/student/CourseAttendanceList';
import { NotificationItem } from '../../components/student/NotificationItem';

export const StudentDashboard: React.FC = () => {
  const firstName = useAuthStore((s) => s.user?.firstName);
  const dashboard = useApiQuery(studentApi.getDashboard, []);
  const attendance = useApiQuery(studentApi.getAttendance, []);

  const courses = useMemo(() => summarizeByCourse(attendance.data ?? []), [attendance.data]);
  const counts = useMemo(() => overallCounts(attendance.data ?? []), [attendance.data]);
  const total = attendance.data?.length ?? 0;
  const rate = presentRate(counts);

  if (dashboard.isLoading || attendance.isLoading) return <PageSkeleton stats={4} />;
  if (dashboard.error || attendance.error) {
    return (
      <Page>
        <PageHeader title="Dashboard" />
        <Card>
          <ErrorState
            message={dashboard.error ?? attendance.error}
            onRetry={() => {
              dashboard.reload();
              attendance.reload();
            }}
          />
        </Card>
      </Page>
    );
  }
  const data = dashboard.data;

  return (
    <Page>
      <PageHeader title={firstName ? `Hello, ${firstName}` : 'Dashboard'} description="Your attendance, recent marks and announcements at a glance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Attendance"
          value={formatPercent(rate)}
          icon={ClipboardCheck}
          hint={total ? `Present in ${counts.PRESENT} of ${total} classes` : 'No classes recorded yet'}
        />
        <StatCard label="Classes recorded" value={formatNumber(total)} icon={CalendarCheck} hint={`Across ${courses.length} courses`} />
        <StatCard label="Latest SGPA" value={data.latestSgpa ?? '—'} icon={GraduationCap} hint={data.latestSgpa ? 'Most recent result' : 'No results yet'} />
        <StatCard label="Outstanding dues" value={formatCurrency(data.pendingFees)} icon={Wallet} hint="Pending and overdue fees" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Attendance by course"
            description="Share of classes marked present"
            actions={
              <ButtonLink to={ROUTES.STUDENT_ATTENDANCE} variant="ghost" size="sm">
                Details <ArrowRight />
              </ButtonLink>
            }
          />
          <div className="mt-5">
            {courses.length === 0 ? (
              <EmptyState compact icon={ClipboardCheck} title="No attendance recorded yet" />
            ) : (
              <CourseAttendanceList courses={courses} />
            )}
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card flush>
            <div className="border-b border-line px-5 py-4">
              <CardHeader
                title="Recent marks"
                actions={
                  <ButtonLink to={ROUTES.STUDENT_MARKS} variant="ghost" size="sm">
                    All marks <ArrowRight />
                  </ButtonLink>
                }
              />
            </div>
            {data.recentMarks.length === 0 ? (
              <EmptyState compact icon={FileText} title="No marks yet" />
            ) : (
              <ul className="divide-y divide-line">
                {data.recentMarks.map((mark) => (
                  <li key={mark.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">{mark.exam.course.name}</p>
                      <p className="text-xs text-fg-subtle">
                        {mark.exam.name} · {humanize(mark.exam.type)} · {formatDate(mark.exam.date)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-fg">
                      {mark.obtainedMarks}
                      <span className="font-normal text-fg-subtle"> / {mark.exam.maxMarks}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card flush>
            <div className="border-b border-line px-5 py-4">
              <CardHeader
                title="Announcements"
                actions={
                  <ButtonLink to={ROUTES.NOTIFICATIONS} variant="ghost" size="sm">
                    View all <ArrowRight />
                  </ButtonLink>
                }
              />
            </div>
            {data.notifications.length === 0 ? (
              <EmptyState compact icon={Bell} title="You're all caught up" description="No unread announcements." />
            ) : (
              <ul className="divide-y divide-line">
                {data.notifications.slice(0, 3).map((n) => (
                  <li key={n.id}>
                    <NotificationItem notification={n} compact />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
};
