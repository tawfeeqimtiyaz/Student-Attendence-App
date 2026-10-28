import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, ClipboardCheck, FileText, Library, ShieldAlert, Users } from 'lucide-react';
import { facultyApi } from '../../api/faculty.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useAuthStore } from '../../stores/auth.store';
import { ROUTES } from '../../constants/routes';
import { formatNumber } from '../../utils/format';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/Stats';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/ui/States';
import { SectionList } from './ManageSections';

const ACTIONS = [
  { label: 'Take attendance', description: 'Record or correct a day’s attendance', to: ROUTES.FACULTY_ATTENDANCE, icon: ClipboardCheck },
  { label: 'Enter marks', description: 'Create an exam and record scores', to: ROUTES.FACULTY_MARKS, icon: FileText },
  { label: 'Assign grades', description: 'Final letter grades per section', to: ROUTES.FACULTY_GRADES, icon: Award },
];

export const FacultyDashboard: React.FC = () => {
  const firstName = useAuthStore((s) => s.user?.firstName);
  const { data, error, isLoading, reload } = useApiQuery(facultyApi.getDashboard, []);

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

  return (
    <Page>
      <PageHeader title={firstName ? `Welcome back, ${firstName}` : 'Dashboard'} description="Your sections and the tasks you do most often." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Sections" value={formatNumber(data.totalSections)} icon={Library} hint="Assigned to you" />
        <StatCard label="Students" value={formatNumber(data.totalStudents)} icon={Users} hint="Enrollments across your sections" />
        <StatCard label="Exams" value={formatNumber(data.totalExams)} icon={FileText} hint="Created for your sections" />
        <StatCard label="Discipline reports" value={formatNumber(data.recentDiscipline)} icon={ShieldAlert} hint="Filed by you" />
      </div>

      <section aria-labelledby="quick-actions">
        <h2 id="quick-actions" className="mb-3 text-sm font-semibold text-fg">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ACTIONS.map(({ label, description, to, icon: Icon }) => (
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

      <Card flush>
        <div className="border-b border-line px-5 py-4">
          <CardHeader
            title="My sections"
            description={`${formatNumber(data.totalSections)} sections this term`}
            actions={
              <ButtonLink to={ROUTES.FACULTY_SECTIONS} variant="ghost" size="sm">
                View all <ArrowRight />
              </ButtonLink>
            }
          />
        </div>
        {data.sections.length === 0 ? (
          <EmptyState icon={Library} title="No sections assigned" description="An administrator assigns sections to faculty." />
        ) : (
          <SectionList sections={data.sections.slice(0, 5)} />
        )}
      </Card>
    </Page>
  );
};
