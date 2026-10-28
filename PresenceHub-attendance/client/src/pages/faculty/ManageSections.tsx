import React from 'react';
import { ClipboardCheck, FileText, Library } from 'lucide-react';
import { facultyApi } from '../../api/faculty.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { ROUTES } from '../../constants/routes';
import { formatNumber } from '../../utils/format';
import type { FacultyDashboardSection } from '../../types/api';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/States';

/** Rows of sections with shortcuts into the per-section workflows. */
export function SectionList({ sections }: { sections: FacultyDashboardSection[] }) {
  return (
    <ul className="divide-y divide-line">
      {sections.map((section) => (
        <li key={section.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-subtle font-mono text-[11px] font-semibold text-fg-muted">
              {section.name}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-fg">{section.course.name}</p>
              <p className="mt-0.5 text-xs text-fg-subtle">
                {section.course.code} · Section {section.name} · {section.academicYear} · Semester {section.semester}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge>{formatNumber(section._count.enrollments)} students</Badge>
                <Badge>{formatNumber(section._count.exams)} exams</Badge>
                {section.course.credits !== undefined && <Badge>{section.course.credits} credits</Badge>}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 md:ml-4">
            <ButtonLink to={`${ROUTES.FACULTY_ATTENDANCE}?section=${section.id}`} size="sm" leftIcon={<ClipboardCheck />} className="flex-1 md:flex-none">
              Attendance
            </ButtonLink>
            <ButtonLink to={`${ROUTES.FACULTY_MARKS}?section=${section.id}`} size="sm" leftIcon={<FileText />} className="flex-1 md:flex-none">
              Marks
            </ButtonLink>
          </div>
        </li>
      ))}
    </ul>
  );
}

export const ManageSections: React.FC = () => {
  const { data, error, isLoading, reload } = useApiQuery(facultyApi.getDashboard, []);

  return (
    <Page>
      <PageHeader title="My sections" description="Course sections assigned to you, with shortcuts to attendance and marks." />
      <Card flush>
        {isLoading ? (
          <SkeletonRows rows={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : data.sections.length === 0 ? (
          <EmptyState icon={Library} title="No sections assigned yet" description="An administrator assigns course sections to faculty." />
        ) : (
          <SectionList sections={data.sections} />
        )}
      </Card>
    </Page>
  );
};
