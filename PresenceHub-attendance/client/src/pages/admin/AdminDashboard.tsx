import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap, Layers, UserPlus, Users } from 'lucide-react';
import { Role } from '@college-erp/shared';
import { adminApi } from '../../api/admin.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { ROUTES } from '../../constants/routes';
import { ROLE_LABELS } from '../../constants/navigation';
import { attendanceTone } from '../../constants/status';
import { formatCurrency, formatNumber, formatTimestamp } from '../../utils/format';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Meter, StatCard } from '../../components/ui/Stats';
import { Badge, type Tone } from '../../components/ui/Badge';
import { PersonCell } from '../../components/ui/Avatar';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/ui/States';

const ROLE_TONE: Record<string, Tone> = { ADMIN: 'brand', FACULTY: 'info', STUDENT: 'neutral' };

const QUICK_LINKS = [
  { label: 'Manage users', description: 'Add accounts, activate or deactivate access', to: ROUTES.ADMIN_USERS, icon: Users },
  { label: 'Courses', description: 'Course catalogue by department and semester', to: ROUTES.ADMIN_COURSES, icon: BookOpen },
  { label: 'Enrollments', description: 'Assign students to course sections', to: ROUTES.ADMIN_ENROLLMENTS, icon: UserPlus },
];

export const AdminDashboard: React.FC = () => {
  const { data, error, isLoading, reload } = useApiQuery(adminApi.getDashboard, []);

  if (isLoading) return <PageSkeleton stats={4} />;
  if (error || !data) {
    return (
      <Page>
        <PageHeader title="Dashboard" />
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      </Page>
    );
  }

  const hasAttendance = data.attendanceRate > 0;

  return (
    <Page>
      <PageHeader title="Dashboard" description="An overview of people, courses and attendance across the institution." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={formatNumber(data.totalStudents)} icon={GraduationCap} hint="Enrolled student profiles" />
        <StatCard label="Faculty" value={formatNumber(data.totalFaculty)} icon={Users} hint="Teaching staff profiles" />
        <StatCard label="Courses" value={formatNumber(data.totalCourses)} icon={BookOpen} hint={`Across ${formatNumber(data.totalDepartments)} departments`} />
        <StatCard label="Sections" value={formatNumber(data.totalSections)} icon={Layers} hint="Course sections with a teacher" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader title="Attendance rate" description="Present or late, last 7 days" />
          {hasAttendance ? (
            <div className="mt-6">
              <p className="text-4xl font-semibold tracking-tight text-fg">{data.attendanceRate}%</p>
              <Meter value={data.attendanceRate} label="Attendance rate, last 7 days" tone={attendanceTone(data.attendanceRate)} className="mt-4" />
              <p className="mt-3 text-xs text-fg-subtle">Share of attendance records marked present or late across all sections.</p>
            </div>
          ) : (
            <EmptyState compact title="No attendance this week" description="Records will appear once faculty mark attendance." />
          )}
          <div className="mt-auto border-t border-line pt-4">
            <p className="text-[13px] font-medium text-fg-muted">Outstanding fees</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-fg">{formatCurrency(data.pendingFees)}</p>
            <p className="mt-0.5 text-xs text-fg-subtle">Total of fees marked pending or overdue</p>
          </div>
        </Card>

        <Card flush className="lg:col-span-2">
          <div className="px-5 pt-5">
            <CardHeader
              title="Newest accounts"
              description="The five most recently created users"
              actions={
                <ButtonLink to={ROUTES.ADMIN_USERS} variant="ghost" size="sm">
                  View all <ArrowRight />
                </ButtonLink>
              }
            />
          </div>
          {data.recentUsers.length === 0 ? (
            <EmptyState icon={Users} title="No users yet" description="Create the first account from the Users page." />
          ) : (
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {data.recentUsers.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <PersonCell person={user} secondary={user.email} />
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-xs text-fg-subtle sm:block">{formatTimestamp(user.createdAt)}</span>
                    <Badge tone={ROLE_TONE[user.role] ?? 'neutral'}>{ROLE_LABELS[user.role as Role] ?? user.role}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section aria-labelledby="quick-links">
        <h2 id="quick-links" className="mb-3 text-sm font-semibold text-fg">
          Quick links
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {QUICK_LINKS.map(({ label, description, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-start gap-3 rounded-xl border border-line bg-card p-4 shadow-xs transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-sm"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-sm font-semibold text-fg">
                  {label}
                  <ArrowRight className="size-3.5 text-fg-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
                <span className="mt-0.5 block text-[13px] text-fg-muted">{description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

    </Page>
  );
};
