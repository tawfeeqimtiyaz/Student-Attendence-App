import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { facultyApi } from '../../api/faculty.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePagination } from '../../hooks/usePagination';
import { DISCIPLINE_ACTIONS, disciplineMeta } from '../../constants/status';
import { formatDate, todayISO } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FormField, Input, Select, Textarea } from '../../components/ui/Form';
import { PersonCell } from '../../components/ui/Avatar';
import { Table, TBody, TD, TH, THead, TR, TableMessage } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Alert, EmptyState, ErrorState, Skeleton, SkeletonRows } from '../../components/ui/States';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { StudentPicker, uniqueStudents } from '../../components/faculty/StudentPicker';

interface DisciplineValues {
  studentId: string;
  incidentDate: string;
  actionTaken: string;
  description: string;
  actionDetails: string;
}

const DEFAULTS: DisciplineValues = { studentId: '', incidentDate: todayISO(), actionTaken: 'WARNING', description: '', actionDetails: '' };

export const ManageDiscipline: React.FC = () => {
  const sections = useApiQuery(facultyApi.getSections, []);
  const records = useApiQuery(facultyApi.getDisciplineRecords, []);
  const students = useMemo(() => uniqueStudents(sections.data), [sections.data]);
  const pagination = usePagination(records.data ?? []);

  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState<DisciplineValues | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DisciplineValues>({ defaultValues: DEFAULTS });
  const description = watch('description');

  const submit = async () => {
    if (!confirming) return;
    setSubmitting(true);
    setError('');
    try {
      await facultyApi.fileDiscipline({
        studentId: confirming.studentId,
        incidentDate: confirming.incidentDate,
        actionTaken: confirming.actionTaken,
        description: confirming.description.trim(),
        ...(confirming.actionDetails.trim() ? { actionDetails: confirming.actionDetails.trim() } : {}),
      });
      toast.success('Discipline record filed');
      setConfirming(null);
      reset({ ...DEFAULTS, incidentDate: todayISO() });
      await records.reload();
    } catch (err) {
      setConfirming(null);
      setError(getErrorMessage(err, 'The record could not be filed.'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmStudent = students.find((s) => s.id === confirming?.studentId);

  return (
    <Page>
      <PageHeader title="Discipline" description="File disciplinary records for students in your sections. Students can see records filed about them." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader title="File a record" />
          {sections.isLoading ? (
            <Skeleton className="mt-5 h-72" />
          ) : sections.error ? (
            <ErrorState message={sections.error} onRetry={sections.reload} className="py-6" />
          ) : students.length === 0 ? (
            <EmptyState compact title="No students in your sections" description="Records can be filed for students enrolled in your sections." />
          ) : (
            <form onSubmit={handleSubmit((values) => setConfirming(values))} noValidate className="mt-5 space-y-4">
              <Controller
                control={control}
                name="studentId"
                rules={{ required: 'Select a student' }}
                render={({ field }) => (
                  <StudentPicker students={students} value={field.value} onChange={field.onChange} error={errors.studentId?.message} />
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <FormField label="Incident date" error={errors.incidentDate?.message} required>
                  <Input
                    type="date"
                    max={todayISO()}
                    {...register('incidentDate', {
                      required: 'Incident date is required',
                      validate: (v) => v <= todayISO() || 'The incident date cannot be in the future',
                    })}
                  />
                </FormField>
                <FormField label="Action taken" required>
                  <Select {...register('actionTaken')}>
                    {DISCIPLINE_ACTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <FormField label="Description" required error={errors.description?.message} hint={`${description.trim().length}/2000 · at least 10 characters`}>
                <Textarea
                  rows={4}
                  maxLength={2000}
                  placeholder="What happened, where, and who was involved."
                  {...register('description', {
                    required: 'Describe the incident',
                    validate: (v) => v.trim().length >= 10 || 'Use at least 10 characters',
                  })}
                />
              </FormField>
              <FormField label="Action details" hint="Optional — e.g. duration of a suspension.">
                <Textarea rows={2} maxLength={1000} {...register('actionDetails')} />
              </FormField>
              {error && <Alert tone="danger">{error}</Alert>}
              <Button type="submit" variant="danger" className="w-full" leftIcon={<ShieldAlert />}>
                Review & file record
              </Button>
            </form>
          )}
        </Card>

        <Card flush className="min-w-0">
          <div className="border-b border-line px-5 py-4">
            <CardHeader title="Records you've filed" description="Most recent first" />
          </div>
          <Table label="Discipline records you've filed" minWidth={640}>
            <THead>
              <tr>
                <TH>Student</TH>
                <TH>Date</TH>
                <TH>Action</TH>
                <TH>Description</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {records.isLoading ? (
                <TableMessage colSpan={5}>
                  <SkeletonRows rows={4} />
                </TableMessage>
              ) : records.error ? (
                <TableMessage colSpan={5}>
                  <ErrorState message={records.error} onRetry={records.reload} />
                </TableMessage>
              ) : pagination.total === 0 ? (
                <TableMessage colSpan={5}>
                  <EmptyState icon={ShieldCheck} title="No records filed" description="Records you file will be listed here." />
                </TableMessage>
              ) : (
                pagination.pageItems.map((r) => {
                  const meta = disciplineMeta(r.actionTaken);
                  return (
                    <TR key={r.id}>
                      <TD>
                        <PersonCell person={r.student?.user} secondary={r.student?.rollNumber} />
                      </TD>
                      <TD className="whitespace-nowrap text-fg-muted">{formatDate(r.incidentDate)}</TD>
                      <TD>
                        <Badge tone={meta.tone} icon={meta.icon}>
                          {meta.label}
                        </Badge>
                      </TD>
                      <TD className="max-w-xs">
                        <p className="line-clamp-2 text-[13px] text-fg-muted" title={r.description}>
                          {r.description}
                        </p>
                      </TD>
                      <TD>{r.isResolved ? <Badge tone="success">Resolved</Badge> : <Badge tone="warning">Open</Badge>}</TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
          <Pagination state={pagination} noun="records" />
        </Card>
      </div>

      <ConfirmDialog
        open={confirming !== null}
        onCancel={() => setConfirming(null)}
        onConfirm={submit}
        loading={submitting}
        title="File this discipline record?"
        confirmLabel="File record"
      >
        {confirming && (
          <div className="space-y-3">
            <p>
              A <strong className="text-fg">{disciplineMeta(confirming.actionTaken).label.toLowerCase()}</strong> will be recorded for{' '}
              <strong className="text-fg">{confirmStudent ? `${confirmStudent.name} (${confirmStudent.rollNumber})` : 'this student'}</strong>, dated{' '}
              {formatDate(confirming.incidentDate)}. The student will be able to see it.
            </p>
            <p className="rounded-md bg-subtle p-3 text-[13px] text-fg-muted">{confirming.description.trim()}</p>
          </div>
        )}
      </ConfirmDialog>
    </Page>
  );
};
