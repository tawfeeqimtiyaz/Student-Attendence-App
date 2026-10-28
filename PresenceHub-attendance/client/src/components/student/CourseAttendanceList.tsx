import { attendanceTone } from '../../constants/status';
import type { CourseAttendance } from '../../utils/attendance';
import { formatPercent } from '../../utils/format';
import { Meter } from '../ui/Stats';

/** One meter per course: present ÷ recorded, with the counts written out. */
export function CourseAttendanceList({ courses }: { courses: CourseAttendance[] }) {
  return (
    <ul className="space-y-4">
      {courses.map((c) => (
        <li key={c.courseId}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-medium text-fg">
              <span className="font-mono text-xs text-fg-subtle">{c.code}</span> {c.name}
            </p>
            <p className="shrink-0 text-sm font-semibold tabular-nums text-fg">{formatPercent(c.rate)}</p>
          </div>
          <Meter value={c.rate ?? 0} label={`${c.name} attendance`} tone={attendanceTone(c.rate)} />
          <p className="mt-1 text-xs text-fg-subtle">
            {c.counts.PRESENT} present of {c.total} classes
            {c.counts.LATE > 0 && ` · ${c.counts.LATE} late`}
            {c.counts.EXCUSED > 0 && ` · ${c.counts.EXCUSED} excused`}
            {c.counts.ABSENT > 0 && ` · ${c.counts.ABSENT} absent`}
          </p>
        </li>
      ))}
    </ul>
  );
}
