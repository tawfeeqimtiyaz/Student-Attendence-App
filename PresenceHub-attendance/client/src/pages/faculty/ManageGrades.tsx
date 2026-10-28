import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Library, RotateCcw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { facultyApi } from '../../api/faculty.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { GRADE_SCALE, gradeTone } from '../../constants/status';
import type { FacultySection, GradeEntry } from '../../types/api';
import { fullName } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Form';
import { PersonCell } from '../../components/ui/Avatar';
import { Table, TBody, TD, TH, THead, TR } from '../../components/ui/Table';
import { Alert, EmptyState, ErrorState, SkeletonRows } from '../../components/ui/States';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { SectionPicker, sortedRoster, useSearchParam } from '../../components/faculty/SectionPicker';

const pointsFor = (grade: string) => GRADE_SCALE.find((g) => g.grade === grade)?.points ?? 0;

function GradesSheet({ section, saved, onSaved, onDirtyChange }: {
  section: FacultySection;
  saved: GradeEntry[];
  onSaved: () => Promise<unknown>;
  onDirtyChange: (d: boolean) => void;
}) {
  const roster = useMemo(() => sortedRoster(section), [section]);
  const baseline = useMemo(() => Object.fromEntries(saved.map((g) => [g.studentId, g.letterGrade])) as Record<string, string>, [saved]);
  const [grades, setGrades] = useState<Record<string, string>>(baseline);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setGrades(baseline), [baseline]);

  const changed = roster.filter((e) => (grades[e.studentId] ?? '') !== (baseline[e.studentId] ?? ''));
  const graded = roster.filter((e) => grades[e.studentId]);
  const isDirty = changed.length > 0;
  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  const save = async () => {
    if (saving || !isDirty) return;
    setSaving(true);
    setError('');
    try {
      await facultyApi.uploadGrades({
        sectionId: section.id,
        records: changed
          .filter((e) => grades[e.studentId])
          .map((e) => ({ studentId: e.studentId, letterGrade: grades[e.studentId], gradePoints: pointsFor(grades[e.studentId]) })),
      });
      await onSaved();
      toast.success(`Grades saved for ${changed.length} ${changed.length === 1 ? 'student' : 'students'}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Grades could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  if (roster.length === 0) return <EmptyState title="No students enrolled in this section" />;

  return (
    <>
      <Table label={`Grades for ${section.course.code} section ${section.name}`} minWidth={600}>
        <THead>
          <tr>
            <TH>Student</TH>
            <TH>Roll no.</TH>
            <TH className="w-44">Letter grade</TH>
            <TH alignTo="right">Grade points</TH>
          </tr>
        </THead>
        <TBody>
          {roster.map((e) => {
            const value = grades[e.studentId] ?? '';
            const isSaved = Boolean(baseline[e.studentId]);
            const isChanged = value !== (baseline[e.studentId] ?? '');
            return (
              <TR key={e.studentId} className={cn(isChanged && 'bg-brand-soft/40')}>
                <TD>
                  <PersonCell person={e.student.user} secondary={isChanged ? 'Edited' : isSaved ? 'Saved' : 'Not graded'} />
                </TD>
                <TD className="font-mono text-xs text-fg-muted">{e.student.rollNumber}</TD>
                <TD>
                  <Select
                    value={value}
                    disabled={saving}
                    onChange={(ev) => {
                      setError('');
                      setGrades((prev) => ({ ...prev, [e.studentId]: ev.target.value }));
                    }}
                    aria-label={`Grade for ${fullName(e.student.user)}`}
                    className="w-32"
                  >
                    {/* A saved grade can be changed but not removed. */}
                    <option value="" disabled={isSaved}>
                      Not graded
                    </option>
                    {GRADE_SCALE.map((g) => (
                      <option key={g.grade} value={g.grade}>
                        {g.grade}
                      </option>
                    ))}
                  </Select>
                </TD>
                <TD alignTo="right">
                  {value ? <Badge tone={gradeTone(value)}>{pointsFor(value)} pts</Badge> : <span className="text-fg-subtle">—</span>}
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
      <div className="sticky bottom-0 z-10 rounded-b-xl border-t border-line bg-card/95 px-5 py-3 backdrop-blur">
        {error && (
          <Alert tone="danger" className="mb-3" title="Grades were not saved">
            {error}
          </Alert>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-fg-muted" aria-live="polite">
            {isDirty ? `${changed.length} unsaved ${changed.length === 1 ? 'change' : 'changes'} · ` : ''}
            {graded.length} of {roster.length} graded
          </p>
          <div className="flex gap-2">
            {isDirty && (
              <Button variant="ghost" leftIcon={<RotateCcw />} onClick={() => setGrades(baseline)} disabled={saving}>
                Discard changes
              </Button>
            )}
            <Button leftIcon={<Save />} onClick={save} loading={saving} disabled={!isDirty} className="flex-1 sm:flex-none">
              Save grades
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export const ManageGrades: React.FC = () => {
  const sections = useApiQuery(facultyApi.getSections, []);
  const [sectionId, setSectionId] = useSearchParam('section');
  const section = sections.data?.find((s) => s.id === sectionId);
  const saved = useApiQuery(section ? () => facultyApi.getGrades(section.id) : null, [section?.id]);

  const [isDirty, setIsDirty] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const guard = useUnsavedChangesGuard(isDirty);
  const onDirtyChange = useCallback((d: boolean) => setIsDirty(d), []);

  return (
    <Page>
      <PageHeader title="Grades" description="Assign final letter grades for each section. Grade points are set from the grading scale." />

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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <SectionPicker
                sections={sections.data}
                isLoading={sections.isLoading}
                value={sectionId}
                onChange={(id) => (isDirty ? setPending(() => () => setSectionId(id || null)) : setSectionId(id || null))}
                className="max-w-xl"
              />
              <div aria-label="Grading scale" className="flex flex-wrap gap-1.5">
                {GRADE_SCALE.map((g) => (
                  <Badge key={g.grade} tone={gradeTone(g.grade)}>
                    {g.grade} = {g.points}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>

          <Card flush>
            {!section ? (
              <EmptyState icon={Award} title="Select a section to assign grades" />
            ) : saved.isLoading && !saved.data ? (
              <SkeletonRows rows={8} />
            ) : saved.error ? (
              <ErrorState
                title="Couldn't load saved grades"
                message={`${saved.error} Grades can't be edited until the saved grades load.`}
                onRetry={saved.reload}
              />
            ) : (
              <GradesSheet key={section.id} section={section} saved={saved.data ?? []} onSaved={saved.reload} onDirtyChange={onDirtyChange} />
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
        title="Discard unsaved grades?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
      >
        <p>Grade changes you haven't saved will be lost.</p>
      </ConfirmDialog>
    </Page>
  );
};
