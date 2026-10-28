import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useSort } from '../../hooks/useSort';
import { usePagination } from '../../hooks/usePagination';
import { getErrorMessage } from '../../utils/errors';
import type { AdminDepartment } from '../../types/api';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FormField, Input, SearchInput, Select, Textarea } from '../../components/ui/Form';
import { SortableTH, Table, TBody, TD, THead, TR, TableMessage, Toolbar } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Alert, EmptyState, ErrorState, SkeletonRows } from '../../components/ui/States';
import { Dialog } from '../../components/ui/Dialog';

export const ManageCourses: React.FC = () => {
  const courses = useApiQuery(adminApi.listCourses, []);
  const departments = useApiQuery(adminApi.listDepartments, []);
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const department = params.get('department') ?? '';
  const semester = params.get('semester') ?? '';

  const setFilter = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (courses.data ?? []).filter(
      (c) =>
        (!department || c.departmentId === department) &&
        (!semester || String(c.semester) === semester) &&
        (!q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
    );
  }, [courses.data, department, semester, search]);

  const { sorted, sort, toggle } = useSort(
    filtered,
    {
      code: (c) => c.code,
      name: (c) => c.name,
      department: (c) => c.department?.code,
      semester: (c) => c.semester,
      credits: (c) => c.credits,
      sections: (c) => c._count.sections,
    },
    { key: 'code', direction: 'asc' }
  );
  const pagination = usePagination(sorted, `${department}|${semester}|${search}`);
  const hasFilters = Boolean(department || semester || search.trim());

  return (
    <Page>
      <PageHeader
        title="Courses"
        description="The course catalogue. Sections of a course are taught by faculty and hold enrolled students."
        actions={
          <Button leftIcon={<Plus />} onClick={() => setShowCreate(true)} disabled={!departments.data?.length}>
            Add course
          </Button>
        }
      />

      <Card flush>
        <Toolbar>
          <SearchInput label="Search courses by name or code" value={search} onChange={setSearch} className="sm:w-72" />
          <div className="grid grid-cols-2 gap-3 sm:flex sm:ml-auto">
            <Select aria-label="Filter by department" value={department} onChange={(e) => setFilter('department', e.target.value)} className="sm:w-48">
              <option value="">All departments</option>
              {(departments.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} — {d.name}
                </option>
              ))}
            </Select>
            <Select aria-label="Filter by semester" value={semester} onChange={(e) => setFilter('semester', e.target.value)} className="sm:w-40">
              <option value="">All semesters</option>
              {Array.from({ length: 8 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Semester {i + 1}
                </option>
              ))}
            </Select>
          </div>
        </Toolbar>

        <Table label="Courses" minWidth={720}>
          <THead>
            <tr>
              <SortableTH label="Code" sortKey="code" sort={sort} onSort={toggle} />
              <SortableTH label="Course" sortKey="name" sort={sort} onSort={toggle} />
              <SortableTH label="Department" sortKey="department" sort={sort} onSort={toggle} />
              <SortableTH label="Semester" sortKey="semester" sort={sort} onSort={toggle} alignTo="right" />
              <SortableTH label="Credits" sortKey="credits" sort={sort} onSort={toggle} alignTo="right" />
              <SortableTH label="Sections" sortKey="sections" sort={sort} onSort={toggle} alignTo="right" />
            </tr>
          </THead>
          <TBody>
            {courses.isLoading ? (
              <TableMessage colSpan={6}>
                <SkeletonRows rows={6} />
              </TableMessage>
            ) : courses.error ? (
              <TableMessage colSpan={6}>
                <ErrorState message={courses.error} onRetry={courses.reload} />
              </TableMessage>
            ) : pagination.total === 0 ? (
              <TableMessage colSpan={6}>
                <EmptyState
                  icon={BookOpen}
                  title={hasFilters ? 'No courses match these filters' : 'No courses yet'}
                  description={hasFilters ? 'Try another search, department or semester.' : 'Add a course to start building the catalogue.'}
                  action={
                    hasFilters && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSearch('');
                          setParams({}, { replace: true });
                        }}
                      >
                        Clear filters
                      </Button>
                    )
                  }
                />
              </TableMessage>
            ) : (
              pagination.pageItems.map((course) => (
                <TR key={course.id}>
                  <TD className="font-mono text-xs font-medium text-fg-muted">{course.code}</TD>
                  <TD>
                    <p className="font-medium text-fg">{course.name}</p>
                    {course.description && <p className="max-w-md truncate text-xs text-fg-subtle">{course.description}</p>}
                  </TD>
                  <TD>
                    <Badge>{course.department?.code ?? '—'}</Badge>
                  </TD>
                  <TD alignTo="right" className="tabular-nums text-fg-muted">
                    {course.semester}
                  </TD>
                  <TD alignTo="right" className="tabular-nums text-fg-muted">
                    {course.credits}
                  </TD>
                  <TD alignTo="right" className="tabular-nums text-fg-muted">
                    {course._count.sections}
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
        <Pagination state={pagination} noun="courses" />
      </Card>

      <CreateCourseDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        departments={departments.data ?? []}
        onCreated={courses.reload}
      />
    </Page>
  );
};

interface CourseValues {
  code: string;
  name: string;
  credits: number;
  departmentId: string;
  semester: number;
  description: string;
}

const EMPTY_COURSE: CourseValues = { code: '', name: '', credits: 3, departmentId: '', semester: 1, description: '' };

function CreateCourseDialog({
  open,
  onClose,
  departments,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  departments: AdminDepartment[];
  onCreated: () => void;
}) {
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseValues>({ defaultValues: EMPTY_COURSE });

  const close = () => {
    if (isSubmitting) return;
    onClose();
    setError('');
    reset(EMPTY_COURSE);
  };

  const onSubmit = async (values: CourseValues) => {
    setError('');
    try {
      await adminApi.createCourse({
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        credits: Number(values.credits),
        semester: Number(values.semester),
        departmentId: values.departmentId,
        description: values.description.trim() || undefined,
      });
      toast.success(`${values.code.trim().toUpperCase()} was added`);
      onCreated();
      onClose();
      reset(EMPTY_COURSE);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create the course.'));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      variant="sheet"
      title="Add course"
      description="Courses belong to a department and are offered in a specific semester."
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="create-course-form" loading={isSubmitting}>
            Create course
          </Button>
        </>
      }
    >
      <form id="create-course-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
          <FormField label="Course code" error={errors.code?.message} required>
            <Input placeholder="e.g. CS101" className="uppercase" {...register('code', { required: 'Course code is required' })} />
          </FormField>
          <FormField label="Credits" error={errors.credits?.message} required>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={6}
              {...register('credits', {
                valueAsNumber: true,
                required: 'Required',
                min: { value: 1, message: '1–6' },
                max: { value: 6, message: '1–6' },
              })}
            />
          </FormField>
        </div>
        <FormField label="Course name" error={errors.name?.message} required>
          <Input placeholder="e.g. Data Structures & Algorithms" {...register('name', { required: 'Course name is required' })} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Department" error={errors.departmentId?.message} required>
            <Select {...register('departmentId', { required: 'Select a department' })}>
              <option value="">Select a department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} — {d.name}
                </option>
              ))}
            </Select>
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
        <FormField label="Description" hint="Optional. Shown under the course name.">
          <Textarea rows={3} {...register('description')} />
        </FormField>
        {error && <Alert tone="danger">{error}</Alert>}
      </form>
    </Dialog>
  );
}
