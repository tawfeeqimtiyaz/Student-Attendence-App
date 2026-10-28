import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Library, Plus, RotateCcw, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { facultyApi } from '../../api/faculty.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { EXAM_TYPES } from '../../constants/status';
import type { FacultyExam, FacultySection } from '../../types/api';
import { formatDate, fullName, humanize, todayISO } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Select } from '../../components/ui/Form';
import { PersonCell } from '../../components/ui/Avatar';
import { Table, TBody, TD, TH, THead, TR } from '../../components/ui/Table';
import { Alert, EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import { ConfirmDialog, Dialog } from '../../components/ui/Dialog';
import { SectionPicker, sortedRoster, useSearchParam, useUpdateSearchParams } from '../../components/faculty/SectionPicker';

type Entry = { marks: string; remarks: string };

function MarksSheet({ section, exam, onDirtyChange }: { section: FacultySection; exam: FacultyExam; onDirtyChange: (d: boolean) => void }) {
  const roster = useMemo(() => sortedRoster(section), [section]);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const filled = roster.filter((e) => entries[e.studentId]?.marks.trim());
  const invalid = filled.filter((e) => {
    const n = Number(entries[e.studentId].marks);
    return Number.isNaN(n) || n < 0 || n > exam.maxMarks;
  });
  const isDirty = Object.values(entries).some((v) => v.marks.trim() || v.remarks.trim());

  React.useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  const set = (studentId: string, patch: Partial<Entry>) => {
    setError('');
    setEntries((prev) => ({ ...prev, [studentId]: { marks: '', remarks: '', ...prev[studentId], ...patch } }));
  };

  const save = async () => {
    if (saving || invalid.length || filled.length === 0) return;
    setSaving(true);
    setError('');
    try {
      await facultyApi.uploadMarks({
        examId: exam.id,
        records: filled.map((e) => {
          const remarks = entries[e.studentId].remarks.trim();
          return { studentId: e.studentId, obtainedMarks: Number(entries[e.studentId].marks), ...(remarks ? { remarks } : {}) };
        }),
      });
      toast.success(`Marks saved for ${filled.length} ${filled.length === 1 ? 'student' : 'students'} · ${exam.name}`);
      setEntries({});
    } catch (err) {
      setError(getErrorMessage(err, 'Marks could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  if (roster.length === 0) {
    return <EmptyState title="No students enrolled in this section" description="Marks can be entered once students are enrolled." />;
  }

  return (
    <>
      <div className="px-5 pt-4">
        <Alert tone="info">
          Enter marks out of <strong>{exam.maxMarks}</strong>. Leave a row blank to skip that student. Saving replaces any marks previously
          entered for the same students in this exam.
        </Alert>
      </div>
      <Table label={`Marks for ${exam.name}`} minWidth={640} className="mt-4">
        <THead>
          <tr>
            <TH>Student</TH>
            <TH>Roll no.</TH>
            <TH className="w-40">Marks / {exam.maxMarks}</TH>
            <TH>Remarks</TH>
          </tr>
        </THead>
        <TBody>
          {roster.map((e) => {
            const entry = entries[e.studentId] ?? { marks: '', remarks: '' };
            const value = entry.marks.trim();
            const n = Number(value);
            const bad = value !== '' && (Number.isNaN(n) || n < 0 || n > exam.maxMarks);
            const name = fullName(e.student.user);
            return (
              <TR key={e.studentId}>
                <TD>
                  <PersonCell person={e.student.user} />
                </TD>
                <TD className="font-mono text-xs text-fg-muted">{e.student.rollNumber}</TD>
                <TD>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={exam.maxMarks}
                    step="0.5"
                    value={entry.marks}
                    disabled={saving}
                    onChange={(ev) => set(e.studentId, { marks: ev.target.value })}
                    aria-label={`Marks for ${name}`}
                    aria-invalid={bad || undefined}
                    className={cn('w-28 tabular-nums', bad && 'border-danger')}
                    placeholder="—"
                  />
                  {bad && <p className="mt-1 text-xs text-danger-text">0–{exam.maxMarks}</p>}
                </TD>
                <TD>
                  <Input
                    value={entry.remarks}
                    maxLength={200}
                    disabled={saving}
                    onChange={(ev) => set(e.studentId, { remarks: ev.target.value })}
                    aria-label={`Remarks for ${name}`}
                    placeholder="Optional"
                  />
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
      <div className="sticky bottom-0 z-10 rounded-b-xl border-t border-line bg-card/95 px-5 py-3 backdrop-blur">
        {error && (
          <Alert tone="danger" className="mb-3" title="Marks were not saved">
            {error}
          </Alert>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-fg-muted" aria-live="polite">
            {invalid.length > 0
              ? `${invalid.length} ${invalid.length === 1 ? 'entry is' : 'entries are'} outside 0–${exam.maxMarks}`
              : `${filled.length} of ${roster.length} students have marks entered`}
          </p>
          <div className="flex gap-2">
            {isDirty && (
              <Button variant="ghost" leftIcon={<RotateCcw />} onClick={() => setEntries({})} disabled={saving}>
                Clear
              </Button>
            )}
            <Button leftIcon={<Upload />} onClick={save} loading={saving} disabled={filled.length === 0 || invalid.length > 0} className="flex-1 sm:flex-none">
              Save marks
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

interface ExamValues {
  name: string;
  type: string;
  maxMarks: number;
  date: string;
}

function CreateExamDialog({ open, section, onClose, onCreated }: { open: boolean; section: FacultySection; onClose: () => void; onCreated: (exam: FacultyExam) => void }) {
  const [error, setError] = useState('');
  const defaults: ExamValues = { name: '', type: 'QUIZ', maxMarks: 20, date: todayISO() };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExamValues>({ defaultValues: defaults });

  const close = () => {
    if (isSubmitting) return;
    onClose();
    setError('');
    reset(defaults);
  };

  const onSubmit = async (values: ExamValues) => {
    setError('');
    try {
      const exam = await facultyApi.createExam({
        courseId: section.courseId,
        sectionId: section.id,
        name: values.name.trim(),
        type: values.type,
        maxMarks: Number(values.maxMarks),
        date: values.date,
      });
      toast.success(`${exam.name} was created`);
      onCreated(exam);
      onClose();
      reset(defaults);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create the exam.'));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="New exam"
      description={`${section.course.code} · Section ${section.name}`}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="create-exam-form" loading={isSubmitting}>
            Create exam
          </Button>
        </>
      }
    >
      <form id="create-exam-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Exam name" error={errors.name?.message} required>
          <Input placeholder="e.g. Quiz 2" {...register('name', { required: 'Exam name is required', maxLength: { value: 100, message: 'Keep it under 100 characters' } })} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Type" required>
            <Select {...register('type')}>
              {EXAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Maximum marks" error={errors.maxMarks?.message} required>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={1000}
              {...register('maxMarks', {
                valueAsNumber: true,
                required: 'Required',
                min: { value: 1, message: 'Between 1 and 1000' },
                max: { value: 1000, message: 'Between 1 and 1000' },
                validate: (v) => Number.isInteger(v) || 'Use a whole number',
              })}
            />
          </FormField>
        </div>
        <FormField label="Exam date" error={errors.date?.message} required>
          <Input type="date" {...register('date', { required: 'Exam date is required' })} />
        </FormField>
        {error && <Alert tone="danger">{error}</Alert>}
      </form>
    </Dialog>
  );
}

export const ManageMarks: React.FC = () => {
  const sections = useApiQuery(facultyApi.getSections, []);
  const [sectionId] = useSearchParam('section');
  const [examId, setExamId] = useSearchParam('exam');
  const updateParams = useUpdateSearchParams();
  const section = sections.data?.find((s) => s.id === sectionId);
  const exams = useApiQuery(section ? () => facultyApi.getExamsForSection(section.id) : null, [section?.id]);
  const exam = exams.data?.find((e) => e.id === examId);

  const [showCreate, setShowCreate] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const guard = useUnsavedChangesGuard(isDirty);
  const onDirtyChange = React.useCallback((d: boolean) => setIsDirty(d), []);
  const guarded = (fn: () => void) => (isDirty ? setPending(() => fn) : fn());

  return (
    <Page>
      <PageHeader title="Marks" description="Record exam and assessment scores for students in your sections." />

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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
              <SectionPicker
                sections={sections.data}
                isLoading={sections.isLoading}
                value={sectionId}
                onChange={(id) =>
                  guarded(() => {
                    setIsDirty(false);
                    updateParams({ section: id || null, exam: null });
                  })
                }
              />
              {section &&
                (exams.isLoading && !exams.data ? (
                  <div>
                    <Skeleton className="mb-2 h-4 w-24" />
                    <Skeleton className="h-9" />
                  </div>
                ) : exams.error ? (
                  <Alert tone="danger" action={<Button size="sm" variant="secondary" onClick={exams.reload}>Retry</Button>}>
                    {exams.error}
                  </Alert>
                ) : (
                  <FormField
                    label="Exam"
                    hint={exam ? `${humanize(exam.type)} · ${formatDate(exam.date)} · out of ${exam.maxMarks}` : exams.data?.length ? undefined : 'No exams yet — create one to enter marks.'}
                    labelAside={
                      <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1 rounded text-[13px] font-medium text-brand-text hover:underline">
                        <Plus className="size-3.5" aria-hidden /> New exam
                      </button>
                    }
                  >
                    <Select value={examId} onChange={(e) => guarded(() => { setIsDirty(false); setExamId(e.target.value || null); })} disabled={!exams.data?.length}>
                      <option value="">{exams.data?.length ? 'Select an exam…' : 'No exams'}</option>
                      {(exams.data ?? []).map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name} · {humanize(x.type)} · {formatDate(x.date)}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                ))}
            </div>
          </Card>

          {!section ? (
            <Card>
              <EmptyState icon={FileText} title="Select a section" description="Then choose or create an exam to enter marks." />
            </Card>
          ) : !exam ? (
            <Card>
              <EmptyState
                icon={FileText}
                title={exams.data?.length ? 'Select an exam' : 'Create the first exam for this section'}
                description="Marks are always recorded against a specific exam."
                action={<Button leftIcon={<Plus />} onClick={() => setShowCreate(true)}>New exam</Button>}
              />
            </Card>
          ) : (
            <Card flush>
              <div className="border-b border-line px-5 py-4">
                <h2 className="text-[15px] font-semibold text-fg">{exam.name}</h2>
                <p className="text-[13px] text-fg-subtle">
                  {section.course.code} · Section {section.name} · {formatDate(exam.date)}
                </p>
              </div>
              <MarksSheet key={exam.id} section={section} exam={exam} onDirtyChange={onDirtyChange} />
            </Card>
          )}

          {section && (
            <CreateExamDialog
              open={showCreate}
              section={section}
              onClose={() => setShowCreate(false)}
              onCreated={async (created) => {
                await exams.reload();
                guarded(() => {
                  setIsDirty(false);
                  setExamId(created.id);
                });
              }}
            />
          )}
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
        title="Discard unsaved marks?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
      >
        <p>Marks you've entered but not saved will be lost.</p>
      </ConfirmDialog>
    </Page>
  );
};
