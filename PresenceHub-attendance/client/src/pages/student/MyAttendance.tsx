import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { AttendanceStatus } from '@college-erp/shared';
import { studentApi } from '../../api/student.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useSort } from '../../hooks/useSort';
import { usePagination } from '../../hooks/usePagination';
import { ATTENDANCE_META, ATTENDANCE_STATUSES } from '../../constants/status';
import { overallCounts, presentRate, summarizeByCourse } from '../../utils/attendance';
import { formatDate, formatPercent } from '../../utils/format';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/Stats';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Form';
import { SortableTH, Table, TBody, TD, TH, THead, TR, TableMessage, Toolbar } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/ui/States';
import { CourseAttendanceList } from '../../components/student/CourseAttendanceList';

export const MyAttendance: React.FC = () => {
  const { data, error, isLoading, reload } = useApiQuery(studentApi.getAttendance, []);
  const [params, setParams] = useSearchParams();
  const course = params.get('course') ?? '';
  const statusParam = params.get('status') ?? '';
  const status = (ATTENDANCE_STATUSES as string[]).includes(statusParam) ? (statusParam as AttendanceStatus) : '';

  const records = data ?? [];
  const courses = useMemo(() => summarizeByCourse(records), [records]);
  const counts = useMemo(() => overallCounts(records), [records]);

  const filtered = useMemo(
    () => records.filter((r) => (!course || r.section.course.code === course) && (!status || r.status === status)),
    [records, course, status]
  );
  const { sorted, sort, toggle } = useSort(
    filtered,
    { date: (r) => r.date, course: (r) => r.section.course.code, status: (r) => r.status },
    { key: 'date', direction: 'desc' }
  );
  const pagination = usePagination(sorted, `${course}|${status}`, 25);

  const setFilter = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );

  if (isLoading) return <PageSkeleton stats={4} />;
  if (error) {
    return (
      <Page>
        <PageHeader title="Attendance" />
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      </Page>
    );
  }

  const hasFilters = Boolean(course || status);

  return (
    <Page>
      <PageHeader title="Attendance" description="Your attendance in every course, and each class as it was recorded." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Overall" value={formatPercent(presentRate(counts))} hint={`${counts.PRESENT} of ${records.length} classes present`} />
        <StatCard label="Absent" value={counts.ABSENT} hint="Classes missed" />
        <StatCard label="Late" value={counts.LATE} hint="Arrived after start" />
        <StatCard label="Excused" value={counts.EXCUSED} hint="Approved absences" />
      </div>

      <Card>
        <CardHeader title="By course" description="Share of classes marked present" />
        <div className="mt-5">
          {courses.length === 0 ? (
            <EmptyState compact icon={ClipboardCheck} title="No attendance recorded yet" description="Records appear here once your teachers mark attendance." />
          ) : (
            <CourseAttendanceList courses={courses} />
          )}
        </div>
      </Card>

      <Card flush>
        <div className="px-5 pt-5">
          <CardHeader title="Class records" />
        </div>
        <Toolbar className="mt-4 border-t">
          <div className="grid grid-cols-1 gap-3 sm:flex">
            <Select aria-label="Filter by course" value={course} onChange={(e) => setFilter('course', e.target.value)} className="sm:w-64">
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </Select>
            <Select aria-label="Filter by status" value={status} onChange={(e) => setFilter('status', e.target.value)} className="sm:w-44">
              <option value="">All statuses</option>
              {ATTENDANCE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ATTENDANCE_META[s].label}
                </option>
              ))}
            </Select>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => setParams({}, { replace: true })} className="sm:ml-auto">
              Clear filters
            </Button>
          )}
        </Toolbar>
        <Table label="Attendance records" minWidth={600}>
          <THead>
            <tr>
              <SortableTH label="Date" sortKey="date" sort={sort} onSort={toggle} />
              <SortableTH label="Course" sortKey="course" sort={sort} onSort={toggle} />
              <TH>Section</TH>
              <SortableTH label="Status" sortKey="status" sort={sort} onSort={toggle} />
              <TH>Remarks</TH>
            </tr>
          </THead>
          <TBody>
            {pagination.total === 0 ? (
              <TableMessage colSpan={5}>
                <EmptyState compact title={hasFilters ? 'No records match these filters' : 'No attendance records yet'} />
              </TableMessage>
            ) : (
              pagination.pageItems.map((r) => {
                const meta = ATTENDANCE_META[r.status];
                return (
                  <TR key={r.id}>
                    <TD className="whitespace-nowrap font-medium">{formatDate(r.date, 'EEE, d MMM yyyy')}</TD>
                    <TD>
                      <span className="font-mono text-xs text-fg-subtle">{r.section.course.code}</span>{' '}
                      <span className="text-fg">{r.section.course.name}</span>
                    </TD>
                    <TD className="text-fg-muted">{r.section.name}</TD>
                    <TD>
                      <Badge tone={meta.tone} icon={meta.icon}>
                        {meta.label}
                      </Badge>
                    </TD>
                    <TD className="text-fg-muted">{r.remarks || '—'}</TD>
                  </TR>
                );
              })
            )}
          </TBody>
        </Table>
        <Pagination state={pagination} noun="classes" />
      </Card>
    </Page>
  );
};
