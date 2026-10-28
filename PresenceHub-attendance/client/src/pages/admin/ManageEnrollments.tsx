import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Layers, Trash2, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePagination } from '../../hooks/usePagination';
import { formatNumber, fullName } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import type { AdminDepartment, AdminEnrollment, AdminSection } from '../../types/api';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PersonCell } from '../../components/ui/Avatar';
import { FormField, SearchInput, Select } from '../../components/ui/Form';
import { Table, TBody, TD, TH, THead, TR, TableMessage, Toolbar } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '../../components/ui/States';
import { ConfirmDialog } from '../../components/ui/Dialog';

function sectionLabel(s: AdminSection) {
  return `${s.course.code} · ${s.course.name} — Section ${s.name}`;
}

export const ManageEnrollments: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const sectionId = params.get('section') ?? '';
  const sections = useApiQuery(adminApi.listSections, []);
  const departments = useApiQuery(adminApi.listDepartments, []);
  const enrollments = useApiQuery(sectionId ? () => adminApi.listEnrollments(sectionId) : null, [sectionId]);

  const [search, setSearch] = useState('');
  const [bulkTarget, setBulkTarget] = useState<AdminDepartment | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdminEnrollment | null>(null);
  const [working, setWorking] = useState(false);

  const section = sections.data?.find((s) => s.id === sectionId);

  const sortedSections = useMemo(
    () => [...(sections.data ?? [])].sort((a, b) => sectionLabel(a).localeCompare(sectionLabel(b))),
    [sections.data]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...(enrollments.data ?? [])].sort((a, b) => a.student.rollNumber.localeCompare(b.student.rollNumber));
    if (!q) return list;
    return list.filter(
      (e) =>
        fullName(e.student.user).toLowerCase().includes(q) ||
        e.student.rollNumber.toLowerCase().includes(q) ||
        e.student.user.email.toLowerCase().includes(q)
    );
  }, [enrollments.data, search]);
  const pagination = usePagination(filtered, `${sectionId}|${search}`);

  const selectSection = (id: string) => {
    setSearch('');
    setParams(id ? { section: id } : {}, { replace: true });
  };

  const refresh = async () => {
    await Promise.all([enrollments.reload(), sections.reload()]);
  };

  const confirmBulk = async () => {
    if (!bulkTarget || !sectionId) return;
    setWorking(true);
    try {
      const res = await adminApi.enrollDepartmentStudents({ sectionId, departmentId: bulkTarget.id });
      const { enrolled, total } = res.data;
      toast.success(
        enrolled === 0
          ? `All ${total} ${bulkTarget.code} students were already enrolled`
          : `Enrolled ${enrolled} of ${total} ${bulkTarget.code} students`
      );
      setBulkTarget(null);
      await refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Enrollment failed.'));
    } finally {
      setWorking(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setWorking(true);
    try {
      await adminApi.removeEnrollment(removeTarget.student.id, sectionId);
      toast.success(`${fullName(removeTarget.student.user)} was removed from the section`);
      setRemoveTarget(null);
      await refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not remove the enrollment.'));
    } finally {
      setWorking(false);
    }
  };

  return (
    <Page>
      <PageHeader title="Enrollments" description="Choose a course section, then enroll students by department or remove individual students." />

      <Card>
        {sections.isLoading ? (
          <Skeleton className="h-16" />
        ) : sections.error ? (
          <ErrorState message={sections.error} onRetry={sections.reload} className="py-6" />
        ) : (
          <FormField
            label="Course section"
            hint={
              section
                ? `Taught by ${section.faculty ? fullName(section.faculty.user) : 'unassigned'} · ${section.academicYear} · Semester ${section.semester}`
                : `${formatNumber(sortedSections.length)} sections available`
            }
          >
            <Select value={sectionId} onChange={(e) => selectSection(e.target.value)} className="max-w-2xl">
              <option value="">Select a section…</option>
              {sortedSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {sectionLabel(s)} ({s._count.enrollments} enrolled)
                </option>
              ))}
            </Select>
          </FormField>
        )}
      </Card>

      {!sectionId ? (
        <Card>
          <EmptyState icon={Layers} title="Select a section to manage its students" description="Enrolled students appear here with tools to add or remove them." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card flush className="min-w-0">
            <div className="px-5 pt-5">
              <CardHeader
                title="Enrolled students"
                description={section ? `${section.course.code} — Section ${section.name}` : undefined}
                actions={<Badge tone="brand">{formatNumber(enrollments.data?.length ?? 0)} enrolled</Badge>}
              />
            </div>
            <Toolbar className="mt-4 border-t">
              <SearchInput label="Search enrolled students" value={search} onChange={setSearch} className="sm:w-72" />
            </Toolbar>
            <Table label="Enrolled students" minWidth={560}>
              <THead>
                <tr>
                  <TH>Student</TH>
                  <TH>Roll number</TH>
                  <TH>Department</TH>
                  <TH alignTo="right" srOnly>
                    Actions
                  </TH>
                </tr>
              </THead>
              <TBody>
                {enrollments.isLoading ? (
                  <TableMessage colSpan={4}>
                    <SkeletonRows rows={5} />
                  </TableMessage>
                ) : enrollments.error ? (
                  <TableMessage colSpan={4}>
                    <ErrorState message={enrollments.error} onRetry={enrollments.reload} />
                  </TableMessage>
                ) : pagination.total === 0 ? (
                  <TableMessage colSpan={4}>
                    <EmptyState
                      icon={Users}
                      title={search ? 'No enrolled students match' : 'No students enrolled yet'}
                      description={search ? 'Try another name or roll number.' : 'Use “Enroll by department” to add students.'}
                    />
                  </TableMessage>
                ) : (
                  pagination.pageItems.map((e) => (
                    <TR key={e.id}>
                      <TD>
                        <PersonCell person={e.student.user} secondary={e.student.user.email} />
                      </TD>
                      <TD className="font-mono text-xs text-fg-muted">{e.student.rollNumber}</TD>
                      <TD>
                        <Badge>{e.student.department?.code}</Badge>
                      </TD>
                      <TD alignTo="right">
                        <Button variant="danger-ghost" size="sm" leftIcon={<Trash2 />} onClick={() => setRemoveTarget(e)}>
                          Remove<span className="sr-only"> {fullName(e.student.user)}</span>
                        </Button>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
            <Pagination state={pagination} noun="students" />
          </Card>

          <Card className="h-fit">
            <CardHeader as="h2" title="Enroll by department" description="Adds every student of a department who isn't already in this section." />
            {departments.isLoading ? (
              <Skeleton className="mt-4 h-40" />
            ) : departments.error ? (
              <ErrorState message={departments.error} onRetry={departments.reload} className="py-6" />
            ) : (
              <ul className="mt-4 space-y-2">
                {departments.data.map((dept) => (
                  <li key={dept.id}>
                    <button
                      type="button"
                      onClick={() => setBulkTarget(dept)}
                      disabled={working || dept._count.students === 0}
                      className="group flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Building2 className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-fg">{dept.name}</span>
                        <span className="block text-xs text-fg-subtle">
                          {dept.code} · {formatNumber(dept._count.students)} students
                        </span>
                      </span>
                      <UserPlus className="size-4 shrink-0 text-fg-subtle group-hover:text-brand-text" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={bulkTarget !== null}
        onCancel={() => setBulkTarget(null)}
        onConfirm={confirmBulk}
        loading={working}
        tone="primary"
        title={`Enroll ${bulkTarget?.code ?? ''} students?`}
        confirmLabel="Enroll students"
      >
        <p>
          All {formatNumber(bulkTarget?._count.students ?? 0)} students in <strong className="text-fg">{bulkTarget?.name}</strong> will be
          enrolled in <strong className="text-fg">{section ? sectionLabel(section) : 'this section'}</strong>. Students who are already enrolled are
          skipped.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={removeTarget !== null}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        loading={working}
        title="Remove student from section?"
        confirmLabel="Remove student"
      >
        <p>
          <strong className="text-fg">{removeTarget ? fullName(removeTarget.student.user) : ''}</strong> will be removed from{' '}
          {section ? sectionLabel(section) : 'this section'} and will no longer appear on its attendance roster. Attendance, marks and grades
          already recorded are kept.
        </p>
      </ConfirmDialog>
    </Page>
  );
};
