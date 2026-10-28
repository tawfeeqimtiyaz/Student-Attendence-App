import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GraduationCap, Library, RotateCcw, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { facultyApi } from '../../api/faculty.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import type { FacultySection } from '../../types/api';
import { currentAcademicYear, fullName, normalizeAcademicYear } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Select } from '../../components/ui/Form';
import { PersonCell } from '../../components/ui/Avatar';
import { Table, TBody, TD, TH, THead, TR } from '../../components/ui/Table';
import { Alert, EmptyState, ErrorState } from '../../components/ui/States';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { SectionPicker, sortedRoster, useSearchParam } from '../../components/faculty/SectionPicker';

const FIELDS = [
  { key: 'sgpa', label: 'SGPA', step: '0.01', max: 10 },
  { key: 'cgpa', label: 'CGPA', step: '0.01', max: 10 },
  { key: 'totalCredits', label: 'Credits (total)', step: '1', max: 60 },
  { key: 'earnedCredits', label: 'Credits (earned)', step: '1', max: 60 },
] as const;
type Field = (typeof FIELDS)[number]['key'];
type Row = Record<Field, string>;
const EMPTY_ROW: Row = { sgpa: '', cgpa: '', totalCredits: '', earnedCredits: '' };
const YEAR_PATTERN = /^\d{4}-\d{4}$/;

function rowProblem(row: Row): string | null {
  const values = FIELDS.map((f) => row[f.key].trim());
  if (values.every((v) => v === '')) return null;
  if (values.some((v) => v === '')) return 'Fill all four values';
  const [sgpa, cgpa, total, earned] = values.map(Number);
  if ([sgpa, cgpa].some((v) => Number.isNaN(v) || v < 0 || v > 10)) return 'GPA must be 0–10';
  if ([total, earned].some((v) => !Number.isInteger(v) || v < 0)) return 'Credits must be whole numbers';
  if (earned > total) return 'Earned credits exceed total';
  return null;
}

function ResultsSheet({ section, onDirtyChange }: { section: FacultySection; onDirtyChange: (d: boolean) => void }) {
  const roster = useMemo(() => sortedRoster(section), [section]);
  const initialYear = YEAR_PATTERN.test(normalizeAcademicYear(section.academicYear)) ? normalizeAcademicYear(section.academicYear) : currentAcademicYear();
  const [semester, setSemester] = useState(section.semester);
  const [academicYear, setAcademicYear] = useState(initialYear);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const complete = roster.filter((e) => {
    const row = rows[e.studentId];
    return row && FIELDS.every((f) => row[f.key].trim() !== '') && !rowProblem(row);
  });
  const problems = roster.filter((e) => rows[e.studentId] && rowProblem(rows[e.studentId]));
  const yearValid = YEAR_PATTERN.test(academicYear);
  const isDirty = Object.values(rows).some((r) => FIELDS.some((f) => r[f.key].trim() !== ''));
  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  const set = (studentId: string, field: Field, value: string) => {
    setError('');
    setRows((prev) => ({ ...prev, [studentId]: { ...EMPTY_ROW, ...prev[studentId], [field]: value } }));
  };

  const save = async () => {
    if (saving || !yearValid || problems.length || complete.length === 0) return;
    setSaving(true);
    setError('');
    try {
      await facultyApi.uploadResults({
        records: complete.map((e) => {
          const r = rows[e.studentId];
          return {
            studentId: e.studentId,
            semester,
            academicYear,
            sgpa: Number(r.sgpa),
            cgpa: Number(r.cgpa),
            totalCredits: Number(r.totalCredits),
            earnedCredits: Number(r.earnedCredits),
          };
        }),
      });
      toast.success(`Results saved for ${complete.length} ${complete.length === 1 ? 'student' : 'students'}`);
      setRows({});
    } catch (err) {
      setError(getErrorMessage(err, 'Results could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  if (roster.length === 0) return <EmptyState title="No students enrolled in this section" />;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 border-b border-line px-5 py-4 sm:grid-cols-2 lg:max-w-xl">
        <FormField label="Semester" required>
          <Select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
            {Array.from({ length: 8 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Semester {i + 1}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Academic year" required hint="Format YYYY-YYYY" error={yearValid ? undefined : 'Use the format YYYY-YYYY, e.g. 2025-2026'}>
          <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value.trim())} placeholder="2025-2026" />
        </FormField>
      </div>
      <div className="px-5 pt-4">
        <Alert tone="info">
          Only rows with all four values are saved; leave a row blank to skip a student. Saving updates an existing result for the same student,
          semester and academic year.
        </Alert>
      </div>
      <Table label="Semester results" minWidth={820} className="mt-4">
        <THead>
          <tr>
            <TH>Student</TH>
            {FIELDS.map((f) => (
              <TH key={f.key}>{f.label}</TH>
            ))}
          </tr>
        </THead>
        <TBody>
          {roster.map((e) => {
            const row = rows[e.studentId] ?? EMPTY_ROW;
            const problem = rowProblem(row);
            const name = fullName(e.student.user);
            return (
              <TR key={e.studentId}>
                <TD>
                  <PersonCell person={e.student.user} secondary={problem ? <span className="text-danger-text">{problem}</span> : e.student.rollNumber} />
                </TD>
                {FIELDS.map((f) => (
                  <TD key={f.key}>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step={f.step}
                      min={0}
                      max={f.max}
                      value={row[f.key]}
                      disabled={saving}
                      onChange={(ev) => set(e.studentId, f.key, ev.target.value)}
                      aria-label={`${f.label} for ${name}`}
                      aria-invalid={problem ? true : undefined}
                      className={cn('w-24 tabular-nums')}
                      placeholder="—"
                    />
                  </TD>
                ))}
              </TR>
            );
          })}
        </TBody>
      </Table>
      <div className="sticky bottom-0 z-10 rounded-b-xl border-t border-line bg-card/95 px-5 py-3 backdrop-blur">
        {error && (
          <Alert tone="danger" className="mb-3" title="Results were not saved">
            {error}
          </Alert>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-fg-muted" aria-live="polite">
            {problems.length > 0
              ? `${problems.length} ${problems.length === 1 ? 'row needs' : 'rows need'} attention`
              : `${complete.length} of ${roster.length} rows ready to save`}
          </p>
          <div className="flex gap-2">
            {isDirty && (
              <Button variant="ghost" leftIcon={<RotateCcw />} onClick={() => setRows({})} disabled={saving}>
                Clear
              </Button>
            )}
            <Button
              leftIcon={<Upload />}
              onClick={save}
              loading={saving}
              disabled={!yearValid || problems.length > 0 || complete.length === 0}
              className="flex-1 sm:flex-none"
            >
              Save results
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export const ManageResults: React.FC = () => {
  const sections = useApiQuery(facultyApi.getSections, []);
  const [sectionId, setSectionId] = useSearchParam('section');
  const section = sections.data?.find((s) => s.id === sectionId);

  const [isDirty, setIsDirty] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const guard = useUnsavedChangesGuard(isDirty);
  const onDirtyChange = useCallback((d: boolean) => setIsDirty(d), []);

  return (
    <Page>
      <PageHeader title="Results" description="Record semester SGPA, CGPA and credits for students in your sections." />

      {sections.error ? (
        <Card>
          <ErrorState message={sections.error} onRetry={sections.reload} />
        </Card>
      ) : !sections.isLoading && sections.data?.length === 0 ? (
        <Card>
          <EmptyState icon={Library} title="No sections assigned to you" />
        </Card>
      ) : (
        <>
          <Card>
            <SectionPicker
              sections={sections.data}
              isLoading={sections.isLoading}
              value={sectionId}
              onChange={(id) => (isDirty ? setPending(() => () => setSectionId(id || null)) : setSectionId(id || null))}
              className="max-w-xl"
            />
          </Card>
          <Card flush>
            {section ? (
              <ResultsSheet key={section.id} section={section} onDirtyChange={onDirtyChange} />
            ) : (
              <EmptyState icon={GraduationCap} title="Select a section" description="Its students are listed so you can enter their semester results." />
            )}
          </Card>
        </>
      )}

      <ConfirmDialog
        open={pending !== null || guard.isBlocked}
        onCancel={() => {
          setPending(null);
          guard.cancel();
        }}
        onConfirm={() => {
          setIsDirty(false);
          if (guard.isBlocked) guard.proceed();
          else {
            pending?.();
            setPending(null);
          }
        }}
        title="Discard unsaved results?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
      >
        <p>Results you've entered but not saved will be lost.</p>
      </ConfirmDialog>
    </Page>
  );
};
