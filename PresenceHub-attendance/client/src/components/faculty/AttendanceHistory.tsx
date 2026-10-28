// ============================================
// AttendanceHistory — a section's saved attendance, by date or by student.
// "Attended" counts present or late, matching the admin dashboard rate.
// ============================================

import { useMemo, useState } from 'react';
import { CalendarDays, Pencil } from 'lucide-react';
import { AttendanceStatus } from '@college-erp/shared';
import { facultyApi } from '../../api/faculty.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePagination } from '../../hooks/usePagination';
import { useSort } from '../../hooks/useSort';
import { attendanceTone, ATTENDANCE_META } from '../../constants/status';
import type { FacultySection } from '../../types/api';
import { formatDate, formatPercent, fullName } from '../../utils/format';
import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { Meter } from '../ui/Stats';
import { PersonCell } from '../ui/Avatar';
import { SortableTH, Table, TBody, TD, TH, THead, TR, TableMessage, Toolbar } from '../ui/Table';
import { Pagination } from '../ui/Pagination';
import { EmptyState, ErrorState, SkeletonRows } from '../ui/States';

type Counts = Record<AttendanceStatus, number>;
const emptyCounts = (): Counts => ({ PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 });
const attendedRate = (c: Counts) => {
  const total = c.PRESENT + c.ABSENT + c.LATE + c.EXCUSED;
  return total ? ((c.PRESENT + c.LATE) / total) * 100 : null;
};

function StatusCount({ status, value }: { status: AttendanceStatus; value: number }) {
  const meta = ATTENDANCE_META[status];
  return (
    <span className={value === 0 ? 'text-fg-subtle' : 'font-medium text-fg'}>
      <span className="tabular-nums">{value}</span>
      <span className="sr-only"> {meta.label.toLowerCase()}</span>
    </span>
  );
}

function RateCell({ rate }: { rate: number | null }) {
  return (
    <div className="flex items-center justify-end gap-3">
      <Meter value={rate ?? 0} label="Attended" tone={attendanceTone(rate)} className="hidden w-20 sm:block" />
      <span className="w-12 text-right tabular-nums font-medium">{formatPercent(rate)}</span>
    </div>
  );
}

export function AttendanceHistory({ section, onEditDate }: { section: FacultySection; onEditDate: (date: string) => void }) {
  const history = useApiQuery(() => facultyApi.getAttendanceHistory(section.id), [section.id]);
  const [view, setView] = useState<'dates' | 'students'>('dates');

  const byDate = useMemo(() => {
    const map = new Map<string, Counts>();
    for (const r of history.data ?? []) {
      const key = r.date.slice(0, 10);
      if (!map.has(key)) map.set(key, emptyCounts());
      map.get(key)![r.status]++;
    }
    return [...map.entries()].map(([date, counts]) => ({ date, counts, rate: attendedRate(counts) }));
  }, [history.data]);

  const byStudent = useMemo(() => {
    const map = new Map<string, { id: string; name: string; person: { firstName: string; lastName: string }; roll: string; counts: Counts }>();
    for (const r of history.data ?? []) {
      if (!map.has(r.studentId)) {
        map.set(r.studentId, { id: r.studentId, name: fullName(r.student.user), person: r.student.user, roll: r.student.rollNumber, counts: emptyCounts() });
      }
      map.get(r.studentId)!.counts[r.status]++;
    }
    return [...map.values()].map((s) => ({ ...s, rate: attendedRate(s.counts) }));
  }, [history.data]);

  const dateSort = useSort(byDate, { date: (d) => d.date, rate: (d) => d.rate }, { key: 'date', direction: 'desc' });
  const studentSort = useSort(
    byStudent,
    { name: (s) => s.name, roll: (s) => s.roll, rate: (s) => s.rate },
    { key: 'rate', direction: 'asc' }
  );
  const datePages = usePagination(dateSort.sorted, section.id);
  const studentPages = usePagination(studentSort.sorted, section.id);

  const body = () => {
    if (history.isLoading)
      return (
        <TableMessage colSpan={7}>
          <SkeletonRows rows={5} />
        </TableMessage>
      );
    if (history.error)
      return (
        <TableMessage colSpan={7}>
          <ErrorState message={history.error} onRetry={history.reload} />
        </TableMessage>
      );
    if (byDate.length === 0)
      return (
        <TableMessage colSpan={7}>
          <EmptyState icon={CalendarDays} title="No attendance recorded yet" description="Saved attendance for this section will appear here." />
        </TableMessage>
      );
    return null;
  };

  return (
    <div>
      <Toolbar className="sm:justify-between">
        <Tabs
          label="Group history"
          value={view}
          onChange={setView}
          items={[
            { value: 'dates', label: 'By date', count: byDate.length },
            { value: 'students', label: 'By student', count: byStudent.length },
          ]}
        />
        <p className="text-xs text-fg-subtle">Attended = present or late</p>
      </Toolbar>

      {view === 'dates' ? (
        <>
          <Table label="Attendance by date" minWidth={680}>
            <THead>
              <tr>
                <SortableTH label="Date" sortKey="date" sort={dateSort.sort} onSort={dateSort.toggle} />
                <TH alignTo="right">Present</TH>
                <TH alignTo="right">Absent</TH>
                <TH alignTo="right">Late</TH>
                <TH alignTo="right">Excused</TH>
                <SortableTH label="Attended" sortKey="rate" sort={dateSort.sort} onSort={dateSort.toggle} alignTo="right" />
                <TH alignTo="right" srOnly>
                  Actions
                </TH>
              </tr>
            </THead>
            <TBody>
              {body() ??
                datePages.pageItems.map((d) => (
                  <TR key={d.date}>
                    <TD className="whitespace-nowrap font-medium">{formatDate(d.date, 'EEE, d MMM yyyy')}</TD>
                    {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map((s) => (
                      <TD key={s} alignTo="right">
                        <StatusCount status={s} value={d.counts[s]} />
                      </TD>
                    ))}
                    <TD alignTo="right">
                      <RateCell rate={d.rate} />
                    </TD>
                    <TD alignTo="right">
                      <Button variant="ghost" size="sm" leftIcon={<Pencil />} onClick={() => onEditDate(d.date)}>
                        Edit<span className="sr-only"> attendance for {formatDate(d.date)}</span>
                      </Button>
                    </TD>
                  </TR>
                ))}
            </TBody>
          </Table>
          <Pagination state={datePages} noun="days" />
        </>
      ) : (
        <>
          <Table label="Attendance by student" minWidth={720}>
            <THead>
              <tr>
                <SortableTH label="Student" sortKey="name" sort={studentSort.sort} onSort={studentSort.toggle} />
                <SortableTH label="Roll no." sortKey="roll" sort={studentSort.sort} onSort={studentSort.toggle} />
                <TH alignTo="right">Present</TH>
                <TH alignTo="right">Absent</TH>
                <TH alignTo="right">Late</TH>
                <TH alignTo="right">Excused</TH>
                <SortableTH label="Attended" sortKey="rate" sort={studentSort.sort} onSort={studentSort.toggle} alignTo="right" />
              </tr>
            </THead>
            <TBody>
              {body() ??
                studentPages.pageItems.map((s) => (
                  <TR key={s.id}>
                    <TD>
                      <PersonCell person={s.person} />
                    </TD>
                    <TD className="font-mono text-xs text-fg-muted">{s.roll}</TD>
                    {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map((st) => (
                      <TD key={st} alignTo="right">
                        <StatusCount status={st} value={s.counts[st]} />
                      </TD>
                    ))}
                    <TD alignTo="right">
                      <RateCell rate={s.rate} />
                    </TD>
                  </TR>
                ))}
            </TBody>
          </Table>
          <Pagination state={studentPages} noun="students" />
        </>
      )}
    </div>
  );
}
