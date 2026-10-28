// ============================================
// AttendanceSheet — mark or edit one section's attendance for one date.
// Starts from what the server has persisted for that date; only after a
// successful save does the baseline move (re-read from the server).
// ============================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCheck, RotateCcw, Save, UserX, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { AttendanceStatus } from '@college-erp/shared';
import { facultyApi } from '../../api/faculty.api';
import { ATTENDANCE_META, ATTENDANCE_STATUSES } from '../../constants/status';
import type { AttendanceEntry, FacultySection } from '../../types/api';
import { cn } from '../../utils/cn';
import { formatDate, fullName } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/Form';
import { Alert, EmptyState } from '../ui/States';
import { sortedRoster } from './SectionPicker';

interface Mark {
  status: AttendanceStatus;
  remarks: string;
}
type Sheet = Record<string, Mark>;

function buildSheet(section: FacultySection, existing: AttendanceEntry[]): Sheet {
  const saved = new Map(existing.map((r) => [r.studentId, r]));
  const sheet: Sheet = {};
  for (const e of section.enrollments) {
    const record = saved.get(e.studentId);
    sheet[e.studentId] = { status: record?.status ?? AttendanceStatus.PRESENT, remarks: record?.remarks ?? '' };
  }
  return sheet;
}

const pillTone: Record<AttendanceStatus, string> = {
  PRESENT: 'peer-checked:bg-success-soft peer-checked:text-success-text peer-checked:ring-success/40',
  ABSENT: 'peer-checked:bg-danger-soft peer-checked:text-danger-text peer-checked:ring-danger/40',
  LATE: 'peer-checked:bg-warning-soft peer-checked:text-warning-text peer-checked:ring-warning/50',
  EXCUSED: 'peer-checked:bg-info-soft peer-checked:text-info-text peer-checked:ring-info/40',
};

function StatusPicker({ name, studentName, value, onChange, disabled }: {
  name: string;
  studentName: string;
  value: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  disabled: boolean;
}) {
  return (
    <fieldset className="min-w-0" disabled={disabled}>
      <legend className="sr-only">Attendance for {studentName}</legend>
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-subtle p-1 ring-1 ring-inset ring-line">
        {ATTENDANCE_STATUSES.map((status) => {
          const meta = ATTENDANCE_META[status];
          const Icon = meta.icon;
          return (
            <label key={status} className="relative min-w-0">
              <input
                type="radio"
                name={name}
                value={status}
                checked={value === status}
                onChange={() => onChange(status)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-fg-muted ring-1 ring-inset ring-transparent transition-colors',
                  'hover:bg-card hover:text-fg peer-checked:shadow-xs',
                  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-brand',
                  'peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
                  pillTone[status]
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline md:hidden xl:inline">{meta.label}</span>
                <span aria-hidden className="sm:hidden md:inline xl:hidden">{meta.short}</span>
                <span className="sr-only sm:hidden md:inline xl:hidden">{meta.label}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

interface AttendanceSheetProps {
  section: FacultySection;
  date: string;
  existing: AttendanceEntry[];
  /** Re-reads persisted records after a save. */
  onSaved: () => Promise<unknown>;
  onDirtyChange: (dirty: boolean) => void;
}

export function AttendanceSheet({ section, date, existing, onSaved, onDirtyChange }: AttendanceSheetProps) {
  const roster = useMemo(() => sortedRoster(section), [section]);
  const [baseline, setBaseline] = useState<Sheet>(() => buildSheet(section, existing));
  const [sheet, setSheet] = useState<Sheet>(baseline);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const savingRef = useRef(false);

  // When the persisted records change (after a save), adopt them as the new baseline.
  useEffect(() => {
    const next = buildSheet(section, existing);
    setBaseline(next);
    setSheet(next);
  }, [section, existing]);

  const isRecorded = existing.length > 0;
  const recordedIds = useMemo(() => new Set(existing.map((r) => r.studentId)), [existing]);
  const changedCount = roster.filter((e) => {
    const a = sheet[e.studentId];
    const b = baseline[e.studentId];
    return a && b && (a.status !== b.status || a.remarks.trim() !== b.remarks.trim());
  }).length;
  const isDirty = changedCount > 0;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    for (const e of roster) c[sheet[e.studentId]?.status ?? AttendanceStatus.PRESENT]++;
    return c;
  }, [roster, sheet]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter((e) => fullName(e.student.user).toLowerCase().includes(q) || e.student.rollNumber.toLowerCase().includes(q));
  }, [roster, search]);

  const update = (studentId: string, patch: Partial<Mark>) => {
    setSaveError('');
    setSheet((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  };

  const markAll = (status: AttendanceStatus) => {
    setSaveError('');
    setSheet((prev) => {
      const next = { ...prev };
      for (const e of roster) next[e.studentId] = { ...next[e.studentId], status };
      return next;
    });
  };

  const save = async () => {
    if (savingRef.current) return; // prevent duplicate submissions
    savingRef.current = true;
    setSaving(true);
    setSaveError('');
    try {
      await facultyApi.markAttendance({
        sectionId: section.id,
        date,
        records: roster.map((e) => {
          const mark = sheet[e.studentId];
          const remarks = mark.remarks.trim();
          const hadRemarks = Boolean(baseline[e.studentId]?.remarks.trim());
          // Omitted remarks are left unchanged by the server, so send '' to clear one.
          return { studentId: e.studentId, status: mark.status, ...(remarks || hadRemarks ? { remarks } : {}) };
        }),
      });
      await onSaved();
      toast.success(`Attendance saved for ${roster.length} students · ${formatDate(date)}`);
    } catch (err) {
      // Keep the faculty member's edits on screen so nothing is lost.
      setSaveError(getErrorMessage(err, 'Attendance could not be saved.'));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (roster.length === 0) {
    return (
      <EmptyState icon={Users} title="No students enrolled in this section" description="Ask an administrator to enroll students before taking attendance." />
    );
  }

  const canSave = !isRecorded || isDirty;

  return (
    <div>
      <div className="space-y-4 px-5 pt-5">
        {isRecorded ? (
          <Alert tone="info" title={`Attendance for ${formatDate(date, 'EEEE, d MMMM yyyy')} is already recorded`}>
            You are viewing the saved records. Any changes you save will update them.
          </Alert>
        ) : (
          <Alert tone="warning" title={`Not recorded yet for ${formatDate(date, 'EEEE, d MMMM yyyy')}`}>
            Everyone starts as Present. Adjust anyone who was absent, late or excused, then save.
          </Alert>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <ul className="flex flex-wrap gap-2" aria-label="Attendance summary">
            {ATTENDANCE_STATUSES.map((status) => (
              <li key={status}>
                <Badge tone={ATTENDANCE_META[status].tone} icon={ATTENDANCE_META[status].icon}>
                  {ATTENDANCE_META[status].label} <span className="tabular-nums font-semibold">{counts[status]}</span>
                </Badge>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput label="Find a student" value={search} onChange={setSearch} className="sm:w-60" />
            <div className="flex gap-2">
              <Button variant="secondary" size="md" leftIcon={<CheckCheck />} onClick={() => markAll(AttendanceStatus.PRESENT)} disabled={saving} className="flex-1 sm:flex-none">
                All present
              </Button>
              <Button variant="secondary" size="md" leftIcon={<UserX />} onClick={() => markAll(AttendanceStatus.ABSENT)} disabled={saving} className="flex-1 sm:flex-none">
                All absent
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 hidden grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)] gap-4 border-y border-line bg-subtle/70 px-5 py-2.5 text-xs font-medium text-fg-muted md:grid" aria-hidden>
        <span>Student</span>
        <span>Status</span>
        <span>Remarks</span>
      </div>

      {visible.length === 0 ? (
        <EmptyState compact title="No students match your search" className="border-t border-line md:border-t-0" />
      ) : (
        <ul className="divide-y divide-line border-t border-line md:border-t-0">
          {visible.map((e) => {
            const mark = sheet[e.studentId];
            const name = fullName(e.student.user);
            const changed = mark.status !== baseline[e.studentId].status || mark.remarks.trim() !== baseline[e.studentId].remarks.trim();
            return (
              <li
                key={e.studentId}
                className={cn(
                  'grid grid-cols-1 gap-3 px-5 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)] md:items-center md:gap-4',
                  changed && 'bg-brand-soft/40'
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar person={e.student.user} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{name}</p>
                    <p className="flex items-center gap-2 text-xs text-fg-subtle">
                      <span className="font-mono">{e.student.rollNumber}</span>
                      {isRecorded && !recordedIds.has(e.studentId) && <span className="text-warning-text">· Not recorded</span>}
                      {changed && <span className="font-medium text-brand-text">· Edited</span>}
                    </p>
                  </div>
                </div>
                <StatusPicker
                  name={`status-${e.studentId}`}
                  studentName={name}
                  value={mark.status}
                  onChange={(status) => update(e.studentId, { status })}
                  disabled={saving}
                />
                <input
                  type="text"
                  value={mark.remarks}
                  maxLength={200}
                  disabled={saving}
                  onChange={(ev) => update(e.studentId, { remarks: ev.target.value })}
                  placeholder="Add a remark (optional)"
                  aria-label={`Remarks for ${name}`}
                  className="h-9 w-full rounded-md border border-transparent bg-transparent px-2.5 text-[13px] text-fg placeholder:text-fg-subtle hover:border-line focus:border-brand focus:bg-card focus:outline-none focus:ring-3 focus:ring-brand-ring disabled:opacity-60"
                />
              </li>
            );
          })}
        </ul>
      )}

      {/* ---- Save bar (sticks to the viewport bottom while the sheet scrolls) ---- */}
      <div className="sticky bottom-0 z-10 rounded-b-xl border-t border-line bg-card/95 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        {saveError && (
          <Alert tone="danger" className="mb-3" title="Attendance was not saved">
            {saveError} Your changes are still here — try again.
          </Alert>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-fg-muted" aria-live="polite">
            {saving
              ? 'Saving…'
              : isDirty
                ? `${changedCount} unsaved ${changedCount === 1 ? 'change' : 'changes'}`
                : isRecorded
                  ? 'All changes saved'
                  : `${roster.length} students ready to record`}
          </p>
          <div className="flex gap-2">
            {isDirty && (
              <Button variant="ghost" leftIcon={<RotateCcw />} onClick={() => setSheet(baseline)} disabled={saving}>
                Discard changes
              </Button>
            )}
            <Button leftIcon={<Save />} onClick={save} loading={saving} disabled={!canSave} className="flex-1 sm:flex-none">
              {isRecorded ? 'Save changes' : 'Save attendance'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
