// ============================================
// Domain status vocabularies — one place for labels, tones and icons
// so every screen shows the same status the same way.
// ============================================

import { AlertTriangle, Ban, Check, CircleDollarSign, Clock, FileCheck2, Gavel, HandHelping, ShieldAlert, X } from 'lucide-react';
import type { ComponentType } from 'react';
import { AttendanceStatus } from '@college-erp/shared';
import type { Tone } from '../components/ui/Badge';

interface StatusMeta {
  label: string;
  tone: Tone;
  icon: ComponentType<{ className?: string }>;
}

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  AttendanceStatus.PRESENT,
  AttendanceStatus.ABSENT,
  AttendanceStatus.LATE,
  AttendanceStatus.EXCUSED,
];

export const ATTENDANCE_META: Record<AttendanceStatus, StatusMeta & { short: string }> = {
  PRESENT: { label: 'Present', short: 'P', tone: 'success', icon: Check },
  ABSENT: { label: 'Absent', short: 'A', tone: 'danger', icon: X },
  LATE: { label: 'Late', short: 'L', tone: 'warning', icon: Clock },
  EXCUSED: { label: 'Excused', short: 'E', tone: 'info', icon: FileCheck2 },
};

export const FEE_STATUS_META: Record<string, StatusMeta> = {
  PAID: { label: 'Paid', tone: 'success', icon: Check },
  PENDING: { label: 'Pending', tone: 'warning', icon: Clock },
  PARTIALLY_PAID: { label: 'Partially paid', tone: 'info', icon: CircleDollarSign },
  OVERDUE: { label: 'Overdue', tone: 'danger', icon: AlertTriangle },
};

export const DISCIPLINE_ACTIONS: { value: string; label: string; icon: ComponentType<{ className?: string }>; tone: Tone }[] = [
  { value: 'WARNING', label: 'Warning', icon: AlertTriangle, tone: 'warning' },
  { value: 'FINE', label: 'Fine', icon: CircleDollarSign, tone: 'warning' },
  { value: 'COMMUNITY_SERVICE', label: 'Community service', icon: HandHelping, tone: 'info' },
  { value: 'SUSPENSION', label: 'Suspension', icon: ShieldAlert, tone: 'danger' },
  { value: 'EXPULSION', label: 'Expulsion', icon: Ban, tone: 'danger' },
];

export function disciplineMeta(value: string) {
  return DISCIPLINE_ACTIONS.find((a) => a.value === value) ?? { value, label: value, icon: Gavel, tone: 'neutral' as Tone };
}

export const EXAM_TYPES = [
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'MIDTERM', label: 'Midterm' },
  { value: 'PRACTICAL', label: 'Practical' },
  { value: 'FINAL', label: 'Final' },
];

/** Letter grades accepted by the server validator, with their grade points. */
export const GRADE_SCALE = [
  { grade: 'A+', points: 10 },
  { grade: 'A', points: 9 },
  { grade: 'B+', points: 8 },
  { grade: 'B', points: 7 },
  { grade: 'C', points: 5 },
  { grade: 'D', points: 4 },
  { grade: 'F', points: 0 },
];

export function gradeTone(grade: string): Tone {
  if (grade.startsWith('A')) return 'success';
  if (grade.startsWith('B')) return 'brand';
  if (grade === 'C' || grade === 'D') return 'warning';
  if (grade === 'F') return 'danger';
  return 'neutral';
}

/** Severity for an attendance rate, used for meters and badges. */
export function attendanceTone(rate: number | null): Tone {
  if (rate === null) return 'neutral';
  if (rate >= 85) return 'success';
  if (rate >= 75) return 'warning';
  return 'danger';
}
