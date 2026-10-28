import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { facultyApi } from '../../api/faculty.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePagination } from '../../hooks/usePagination';
import { FEE_STATUS_META } from '../../constants/status';
import { currentAcademicYear, formatCurrency, formatDate, todayISO } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FormField, Input, Select } from '../../components/ui/Form';
import { PersonCell } from '../../components/ui/Avatar';
import { Table, TBody, TD, TH, THead, TR, TableMessage } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Alert, EmptyState, ErrorState, Skeleton, SkeletonRows } from '../../components/ui/States';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { StudentPicker, uniqueStudents } from '../../components/faculty/StudentPicker';

interface FineValues {
  studentId: string;
  amount: string;
  dueDate: string;
  academicYear: string;
  semester: number;
}

const defaults = (): FineValues => ({ studentId: '', amount: '', dueDate: '', academicYear: currentAcademicYear(), semester: 1 });

export const ManageFines: React.FC = () => {
  const sections = useApiQuery(facultyApi.getSections, []);
  const fines = useApiQuery(facultyApi.getAssignedFines, []);
  const students = useMemo(() => uniqueStudents(sections.data), [sections.data]);
  const pagination = usePagination(fines.data ?? []);

  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState<FineValues | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FineValues>({ defaultValues: defaults() });

  const submit = async () => {
    if (!confirming) return;
    setSubmitting(true);
    setError('');
    try {
      await facultyApi.assignFine({
        studentId: confirming.studentId,
        amount: Number(confirming.amount),
        dueDate: confirming.dueDate,
        academicYear: confirming.academicYear.trim(),
        semester: Number(confirming.semester),
      });
      toast.success(`Fine of ${formatCurrency(Number(confirming.amount))} assigned`);
      setConfirming(null);
      reset(defaults());
      await fines.reload();
    } catch (err) {
      setConfirming(null);
      setError(getErrorMessage(err, 'The fine could not be assigned.'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmStudent = students.find((s) => s.id === confirming?.studentId);

  return (
    <Page>
      <PageHeader title="Fines" description="Assign fines to students in your sections. Fines appear in the student's fee details." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader title="Assign a fine" />
          {sections.isLoading ? (
            <Skeleton className="mt-5 h-72" />
          ) : sections.error ? (
            <ErrorState message={sections.error} onRetry={sections.reload} className="py-6" />
          ) : students.length === 0 ? (
            <EmptyState compact title="No students in your sections" />
          ) : (
            <form onSubmit={handleSubmit((values) => setConfirming(values))} noValidate className="mt-5 space-y-4">
              <Controller
                control={control}
                name="studentId"
                rules={{ required: 'Select a student' }}
                render={({ field }) => <StudentPicker students={students} value={field.value} onChange={field.onChange} error={errors.studentId?.message} />}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <FormField label="Amount (₹)" error={errors.amount?.message} required>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    {...register('amount', {
                      required: 'Enter an amount',
                      validate: (v) => Number(v) > 0 || 'Amount must be greater than zero',
                    })}
                  />
                </FormField>
                <FormField label="Due date" error={errors.dueDate?.message} required>
                  <Input type="date" min={todayISO()} {...register('dueDate', { required: 'Choose a due date' })} />
                </FormField>
                <FormField label="Academic year" error={errors.academicYear?.message} hint="Format YYYY-YYYY" required>
                  <Input
                    placeholder="2025-2026"
                    {...register('academicYear', {
                      required: 'Academic year is required',
                      pattern: { value: /^\d{4}-\d{4}$/, message: 'Use the format YYYY-YYYY' },
                    })}
                  />
                </FormField>
                <FormField label="Semester" required>
                  <Select {...register('semester', { valueAsNumber: true })}>
                    {Array.from({ length: 8 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Semester {i + 1}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              {error && <Alert tone="danger">{error}</Alert>}
              <Button type="submit" className="w-full" leftIcon={<Receipt />}>
                Review & assign fine
              </Button>
            </form>
          )}
        </Card>

        <Card flush className="min-w-0">
          <div className="border-b border-line px-5 py-4">
            <CardHeader title="Fines on record" description="All fines recorded in the system, newest first" />
          </div>
          <Table label="Fines on record" minWidth={640}>
            <THead>
              <tr>
                <TH>Student</TH>
                <TH alignTo="right">Amount</TH>
                <TH>Due</TH>
                <TH>Term</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {fines.isLoading ? (
                <TableMessage colSpan={5}>
                  <SkeletonRows rows={4} />
                </TableMessage>
              ) : fines.error ? (
                <TableMessage colSpan={5}>
                  <ErrorState message={fines.error} onRetry={fines.reload} />
                </TableMessage>
              ) : pagination.total === 0 ? (
                <TableMessage colSpan={5}>
                  <EmptyState icon={Receipt} title="No fines on record" />
                </TableMessage>
              ) : (
                pagination.pageItems.map((f) => {
                  const status = FEE_STATUS_META[f.status] ?? { label: f.status, tone: 'neutral' as const, icon: undefined };
                  return (
                    <TR key={f.id}>
                      <TD>
                        <PersonCell person={f.student?.user} secondary={f.student?.rollNumber} />
                      </TD>
                      <TD alignTo="right" className="font-medium tabular-nums">
                        {formatCurrency(f.amount)}
                      </TD>
                      <TD className="whitespace-nowrap text-fg-muted">{formatDate(f.dueDate)}</TD>
                      <TD className="whitespace-nowrap text-fg-muted">
                        {f.academicYear} · Sem {f.semester}
                      </TD>
                      <TD>
                        <Badge tone={status.tone} icon={status.icon}>
                          {status.label}
                        </Badge>
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
          <Pagination state={pagination} noun="fines" />
        </Card>
      </div>

      <ConfirmDialog
        open={confirming !== null}
        onCancel={() => setConfirming(null)}
        onConfirm={submit}
        loading={submitting}
        tone="primary"
        title="Assign this fine?"
        confirmLabel="Assign fine"
      >
        {confirming && (
          <p>
            <strong className="text-fg">{confirmStudent ? `${confirmStudent.name} (${confirmStudent.rollNumber})` : 'This student'}</strong> will be
            charged <strong className="text-fg">{formatCurrency(Number(confirming.amount))}</strong>, due {formatDate(confirming.dueDate)} (
            {confirming.academicYear}, semester {confirming.semester}). It will appear in their fee details as pending.
          </p>
        )}
      </ConfirmDialog>
    </Page>
  );
};
