import React, { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useSort } from '../../hooks/useSort';
import { usePagination } from '../../hooks/usePagination';
import { formatDate, formatPercent, humanize } from '../../utils/format';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Form';
import { SortableTH, Table, TBody, TD, TH, THead, TR, TableMessage, Toolbar } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/States';

export const MyMarks: React.FC = () => {
  const { data, error, isLoading, reload } = useApiQuery(studentApi.getMarks, []);
  const [course, setCourse] = useState('');

  const courses = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of data ?? []) map.set(m.exam.course.code, m.exam.course.name);
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  const filtered = useMemo(() => (data ?? []).filter((m) => !course || m.exam.course.code === course), [data, course]);
  const { sorted, sort, toggle } = useSort(
    filtered,
    {
      date: (m) => m.exam.date,
      course: (m) => m.exam.course.code,
      score: (m) => (m.exam.maxMarks ? m.obtainedMarks / m.exam.maxMarks : 0),
    },
    { key: 'date', direction: 'desc' }
  );
  const pagination = usePagination(sorted, course);

  return (
    <Page>
      <PageHeader title="Marks" description="Scores for every exam and assessment you've taken." />
      <Card flush>
        <Toolbar>
          <Select aria-label="Filter by course" value={course} onChange={(e) => setCourse(e.target.value)} className="sm:w-72">
            <option value="">All courses</option>
            {courses.map(([code, name]) => (
              <option key={code} value={code}>
                {code} — {name}
              </option>
            ))}
          </Select>
        </Toolbar>
        <Table label="Marks" minWidth={680}>
          <THead>
            <tr>
              <SortableTH label="Course" sortKey="course" sort={sort} onSort={toggle} />
              <TH>Exam</TH>
              <SortableTH label="Date" sortKey="date" sort={sort} onSort={toggle} />
              <SortableTH label="Score" sortKey="score" sort={sort} onSort={toggle} alignTo="right" />
              <TH alignTo="right">Percent</TH>
              <TH>Remarks</TH>
            </tr>
          </THead>
          <TBody>
            {isLoading ? (
              <TableMessage colSpan={6}>
                <SkeletonRows rows={5} />
              </TableMessage>
            ) : error ? (
              <TableMessage colSpan={6}>
                <ErrorState message={error} onRetry={reload} />
              </TableMessage>
            ) : pagination.total === 0 ? (
              <TableMessage colSpan={6}>
                <EmptyState icon={FileText} title={course ? 'No marks for this course yet' : 'No marks recorded yet'} />
              </TableMessage>
            ) : (
              pagination.pageItems.map((m) => {
                const pct = m.exam.maxMarks ? (m.obtainedMarks / m.exam.maxMarks) * 100 : null;
                return (
                  <TR key={m.id}>
                    <TD>
                      <p className="font-medium text-fg">{m.exam.course.name}</p>
                      <p className="font-mono text-xs text-fg-subtle">{m.exam.course.code}</p>
                    </TD>
                    <TD>
                      <p className="text-fg">{m.exam.name}</p>
                      <Badge className="mt-1">{humanize(m.exam.type)}</Badge>
                    </TD>
                    <TD className="whitespace-nowrap text-fg-muted">{formatDate(m.exam.date)}</TD>
                    <TD alignTo="right" className="whitespace-nowrap tabular-nums">
                      <span className="font-semibold">{m.obtainedMarks}</span>
                      <span className="text-fg-subtle"> / {m.exam.maxMarks}</span>
                    </TD>
                    <TD alignTo="right" className="tabular-nums text-fg-muted">
                      {formatPercent(pct)}
                    </TD>
                    <TD className="text-fg-muted">{m.remarks || '—'}</TD>
                  </TR>
                );
              })
            )}
          </TBody>
        </Table>
        <Pagination state={pagination} noun="marks" />
      </Card>
    </Page>
  );
};
