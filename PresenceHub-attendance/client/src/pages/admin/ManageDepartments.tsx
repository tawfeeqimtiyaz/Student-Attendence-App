import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { BookOpen, Building2, GraduationCap, Plus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatNumber } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FormField, Input } from '../../components/ui/Form';
import { Alert, EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import { Dialog } from '../../components/ui/Dialog';

export const ManageDepartments: React.FC = () => {
  const departments = useApiQuery(adminApi.listDepartments, []);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <Page>
      <PageHeader
        title="Departments"
        description="Academic departments group courses, faculty and students."
        actions={
          <Button leftIcon={<Plus />} onClick={() => setShowCreate(true)}>
            Add department
          </Button>
        }
      />

      {departments.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : departments.error ? (
        <Card>
          <ErrorState message={departments.error} onRetry={departments.reload} />
        </Card>
      ) : departments.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No departments yet"
            description="Departments are needed before you can add courses, faculty or students."
            action={<Button leftIcon={<Plus />} onClick={() => setShowCreate(true)}>Add department</Button>}
          />
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {departments.data.map((dept) => (
            <li key={dept.id}>
              <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
                      <Building2 className="size-[18px]" aria-hidden />
                    </span>
                    <h2 className="text-[15px] font-semibold leading-snug text-fg">{dept.name}</h2>
                  </div>
                  <Badge className="font-mono">{dept.code}</Badge>
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4">
                  {[
                    { label: 'Students', value: dept._count.students, icon: GraduationCap },
                    { label: 'Faculty', value: dept._count.faculty, icon: Users },
                    { label: 'Courses', value: dept._count.courses, icon: BookOpen },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="min-w-0">
                      <dt className="flex items-center gap-1.5 text-xs text-fg-subtle">
                        <Icon className="size-3.5 shrink-0" aria-hidden />
                        {label}
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-fg">{formatNumber(value)}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <CreateDepartmentDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={departments.reload} />
    </Page>
  );
};

interface DepartmentValues {
  name: string;
  code: string;
}

function CreateDepartmentDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentValues>({ defaultValues: { name: '', code: '' } });

  const close = () => {
    if (isSubmitting) return;
    onClose();
    setError('');
    reset();
  };

  const onSubmit = async (values: DepartmentValues) => {
    setError('');
    try {
      await adminApi.createDepartment({ name: values.name.trim(), code: values.code.trim().toUpperCase() });
      toast.success(`${values.name.trim()} was added`);
      onCreated();
      onClose();
      reset();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create the department.'));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Add department"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="create-department-form" loading={isSubmitting}>
            Create department
          </Button>
        </>
      }
    >
      <form id="create-department-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Department name" error={errors.name?.message} required>
          <Input placeholder="e.g. Computer Science & Engineering" {...register('name', { required: 'Department name is required' })} />
        </FormField>
        <FormField label="Code" hint="Short unique code, shown on courses and student records." error={errors.code?.message} required>
          <Input
            placeholder="e.g. CSE"
            className="uppercase"
            maxLength={10}
            {...register('code', {
              required: 'Code is required',
              pattern: { value: /^[A-Za-z0-9-]{2,10}$/, message: 'Use 2–10 letters or numbers' },
            })}
          />
        </FormField>
        {error && <Alert tone="danger">{error}</Alert>}
      </form>
    </Dialog>
  );
}
