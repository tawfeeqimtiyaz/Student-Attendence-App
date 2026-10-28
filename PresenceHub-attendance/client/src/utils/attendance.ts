// ============================================
// Student attendance summaries.
// The percentage uses the same rule as the server's student dashboard:
// classes marked PRESENT ÷ classes recorded.
// ============================================

import { AttendanceStatus } from '@college-erp/shared';
import type { StudentAttendanceRecord } from '../types/api';

export type StatusCounts = Record<AttendanceStatus, number>;

export interface CourseAttendance {
  courseId: string;
  code: string;
  name: string;
  counts: StatusCounts;
  total: number;
  /** null when no classes are recorded */
  rate: number | null;
}

export const emptyCounts = (): StatusCounts => ({ PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 });

export function presentRate(counts: StatusCounts): number | null {
  const total = counts.PRESENT + counts.ABSENT + counts.LATE + counts.EXCUSED;
  return total === 0 ? null : (counts.PRESENT / total) * 100;
}

export function summarizeByCourse(records: StudentAttendanceRecord[]): CourseAttendance[] {
  const map = new Map<string, CourseAttendance>();
  for (const r of records) {
    const course = r.section.course;
    const key = course.id ?? course.code;
    if (!map.has(key)) map.set(key, { courseId: key, code: course.code, name: course.name, counts: emptyCounts(), total: 0, rate: null });
    const entry = map.get(key)!;
    entry.counts[r.status]++;
    entry.total++;
  }
  return [...map.values()]
    .map((c) => ({ ...c, rate: presentRate(c.counts) }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function overallCounts(records: StudentAttendanceRecord[]): StatusCounts {
  const counts = emptyCounts();
  for (const r of records) counts[r.status]++;
  return counts;
}
