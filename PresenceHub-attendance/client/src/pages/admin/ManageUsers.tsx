import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, UserCheck, UserX, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Role } from '@college-erp/shared';
import { adminApi } from '../../api/admin.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSort } from '../../hooks/useSort';
import { usePagination } from '../../hooks/usePagination';
import { useAuthStore } from '../../stores/auth.store';
import { ROLE_LABELS } from '../../constants/navigation';
import { formatTimestamp, fullName } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import type { AdminUser, CreateUserInput } from '../../types/api';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, type Tone } from '../../components/ui/Badge';
import { PersonCell } from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Tabs';
import { FormField, FormSection, Input, SearchInput, Select } from '../../components/ui/Form';
import { SortableTH, Table, TBody, TD, TH, THead, TR, TableMessage, Toolbar } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState, SkeletonRows, Alert } from '../../components/ui/States';
import { ConfirmDialog, Dialog } from '../../components/ui/Dialog';
import { Tooltip } from '../../components/ui/Tooltip';

type RoleFilter = 'ALL' | Role;
const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: Role.STUDENT, label: 'Students' },
  { value: Role.FACULTY, label: 'Faculty' },
  { value: Role.ADMIN, label: 'Admins' },
];
const ROLE_TONE: Record<string, Tone> = { ADMIN: 'brand', FACULTY: 'info', STUDENT: 'neutral' };

function identifierFor(user: AdminUser) {
  return user.student?.rollNumber ?? user.faculty?.employeeId ?? '—';
}
function departmentFor(user: AdminUser) {
  return user.student?.department?.code ?? user.faculty?.department?.code ?? '—';
}

export const ManageUsers: React.FC = () => {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [params, setParams] = useSearchParams();
  const roleParam = params.get('role') as RoleFilter | null;
  const role: RoleFilter = ROLE_FILTERS.some((r) => r.value === roleParam) ? (roleParam as RoleFilter) : 'ALL';
  const [search, setSearch] = useState(params.get('q') ?? '');
  const debouncedSearch = useDebouncedValue(search.trim());

  const [showCreate, setShowCreate] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<AdminUser | null>(null);
  const [toggling, setToggling] = useState(false);

  const updateParam = (key: string, value: string | null) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  };

  // Keep the search term in the URL (debounced) so the view can be bookmarked.
  React.useEffect(() => {
    updateParam('q', debouncedSearch || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const users = useApiQuery(
    () => adminApi.listUsers({ role, search: debouncedSearch || undefined }),
    [role, debouncedSearch]
  );
  const departments = useApiQuery(adminApi.listDepartments, []);

  const { sorted, sort, toggle } = useSort(
    users.data ?? [],
    {
      name: (u) => fullName(u),
      role: (u) => u.role,
      department: (u) => departmentFor(u),
      created: (u) => u.createdAt,
      status: (u) => (u.isActive ? 0 : 1),
    },
    { key: 'created', direction: 'desc' }
  );
  const pagination = usePagination(sorted, `${role}|${debouncedSearch}`);

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    setToggling(true);
    try {
      await adminApi.toggleUserStatus(pendingToggle.id);
      toast.success(`${fullName(pendingToggle)} ${pendingToggle.isActive ? 'deactivated' : 'reactivated'}`);
      setPendingToggle(null);
      await users.reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update the account status.'));
    } finally {
      setToggling(false);
    }
  };

  const hasFilters = role !== 'ALL' || Boolean(debouncedSearch);

  return (
    <Page>
      <PageHeader
        title="Users"
        description="Create accounts for students, faculty and administrators, and control who can sign in."
        actions={
          <Button leftIcon={<Plus />} onClick={() => setShowCreate(true)}>
            Add user
          </Button>
        }
      />

      <Card flush>
        <Toolbar className="sm:justify-between">
          <Tabs
            label="Filter by role"
            items={ROLE_FILTERS}
            value={role}
            onChange={(value) => updateParam('role', value === 'ALL' ? null : value)}
          />
          <SearchInput label="Search by name or email" value={search} onChange={setSearch} className="sm:w-72" />
        </Toolbar>

        <Table label="Users" minWidth={760}>
          <THead>
            <tr>
              <SortableTH label="Name" sortKey="name" sort={sort} onSort={toggle} />
              <SortableTH label="Role" sortKey="role" sort={sort} onSort={toggle} />
              <TH>ID</TH>
              <SortableTH label="Department" sortKey="department" sort={sort} onSort={toggle} />
              <SortableTH label="Created" sortKey="created" sort={sort} onSort={toggle} />
              <SortableTH label="Status" sortKey="status" sort={sort} onSort={toggle} />
              <TH alignTo="right" srOnly>
                Actions
              </TH>
            </tr>
          </THead>
          <TBody>
            {users.isLoading ? (
              <TableMessage colSpan={7}>
                <SkeletonRows rows={6} />
              </TableMessage>
            ) : users.error ? (
              <TableMessage colSpan={7}>
                <ErrorState message={users.error} onRetry={users.reload} />
              </TableMessage>
            ) : pagination.total === 0 ? (
              <TableMessage colSpan={7}>
                <EmptyState
                  icon={Users}
                  title={hasFilters ? 'No users match these filters' : 'No users yet'}
                  description={hasFilters ? 'Try a different name, email or role.' : 'Add the first account to get started.'}
                  action={
                    hasFilters && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSearch('');
                          updateParam('role', null);
                        }}
                      >
                        Clear filters
                      </Button>
                    )
                  }
                />
              </TableMessage>
            ) : (
              pagination.pageItems.map((user) => {
                const isSelf = user.id === currentUserId;
                const action = (
                  <Button
                    variant={user.isActive ? 'danger-ghost' : 'ghost'}
                    size="sm"
                    leftIcon={user.isActive ? <UserX /> : <UserCheck />}
                    disabled={isSelf}
                    onClick={() => setPendingToggle(user)}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                    <span className="sr-only"> {fullName(user)}</span>
                  </Button>
                );
                return (
                  <TR key={user.id}>
                    <TD>
                      <PersonCell person={user} secondary={user.email} />
                    </TD>
                    <TD>
                      <Badge tone={ROLE_TONE[user.role] ?? 'neutral'}>{ROLE_LABELS[user.role as Role] ?? user.role}</Badge>
                    </TD>
                    <TD className="font-mono text-xs text-fg-muted">{identifierFor(user)}</TD>
                    <TD className="text-fg-muted">{departmentFor(user)}</TD>
                    <TD className="whitespace-nowrap text-fg-muted">{formatTimestamp(user.createdAt)}</TD>
                    <TD>
                      {user.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>}
                    </TD>
                    <TD alignTo="right">
                      {isSelf ? (
                        <Tooltip content="You can't deactivate your own account" side="bottom">
                          <span tabIndex={0} className="inline-block rounded-md">
                            {action}
                          </span>
                        </Tooltip>
                      ) : (
                        action
                      )}
                    </TD>
                  </TR>
                );
              })
            )}
          </TBody>
        </Table>
        <Pagination state={pagination} noun="users" />
      </Card>

      <CreateUserDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        departments={departments.data ?? []}
        onCreated={() => users.reload()}
      />

      <ConfirmDialog
        open={pendingToggle !== null}
        onCancel={() => setPendingToggle(null)}
        onConfirm={confirmToggle}
        loading={toggling}
        tone={pendingToggle?.isActive ? 'danger' : 'primary'}
        title={pendingToggle?.isActive ? 'Deactivate this account?' : 'Reactivate this account?'}
        confirmLabel={pendingToggle?.isActive ? 'Deactivate' : 'Reactivate'}
      >
        {pendingToggle?.isActive ? (
          <p>
            <strong className="text-fg">{fullName(pendingToggle)}</strong> will no longer be able to sign in. Their records are kept and you can
            reactivate the account at any time.
          </p>
        ) : (
          <p>
            <strong className="text-fg">{fullName(pendingToggle)}</strong> will be able to sign in again.
          </p>
        )}
      </ConfirmDialog>
    </Page>
  );
};

// ---- Create user ----

interface CreateUserValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  departmentId: string;
  rollNumber: string;
  semester: number;
  employeeId: string;
  designation: string;
}

const EMPTY_USER: CreateUserValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: Role.STUDENT,
  departmentId: '',
  rollNumber: '',
  semester: 1,
  employeeId: '',
  designation: '',
};

function CreateUserDialog({
  open,
  onClose,
  departments,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  departments: { id: string; name: string; code: string }[];
  onCreated: () => void;
}) {
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateUserValues>({ defaultValues: EMPTY_USER });
  const role = watch('role');

  const close = () => {
    if (isSubmitting) return;
    onClose();
    setError('');
    reset(EMPTY_USER);
  };

  const onSubmit = async (values: CreateUserValues) => {
    setError('');
    const payload: CreateUserInput = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      password: values.password,
      role: values.role,
    };
    if (values.role === Role.STUDENT) {
      Object.assign(payload, { departmentId: values.departmentId, rollNumber: values.rollNumber.trim(), semester: Number(values.semester) });
    }
    if (values.role === Role.FACULTY) {
      Object.assign(payload, {
        departmentId: values.departmentId,
        employeeId: values.employeeId.trim(),
        designation: values.designation.trim() || undefined,
      });
    }
    try {
      await adminApi.createUser(payload);
      toast.success(`${payload.firstName} ${payload.lastName} was added`);
      onCreated();
      onClose();
      reset(EMPTY_USER);
    } catch (err) {
      // Keep the entered values so the admin can correct and resubmit.
      setError(getErrorMessage(err, 'Could not create the user.'));
    }
  };

  const needsProfile = role === Role.STUDENT || role === Role.FACULTY;
  const departmentOptions = useMemo(() => departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })), [departments]);

  return (
    <Dialog
      open={open}
      onClose={close}
      variant="sheet"
      title="Add user"
      description="The user signs in with this email (or their roll number / employee ID) and password."
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="create-user-form" loading={isSubmitting} disabled={!isDirty}>
            Create user
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-7">
        <FormSection title="Account">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="First name" error={errors.firstName?.message} required>
              <Input autoComplete="off" {...register('firstName', { required: 'First name is required' })} />
            </FormField>
            <FormField label="Last name" error={errors.lastName?.message} required>
              <Input autoComplete="off" {...register('lastName', { required: 'Last name is required' })} />
            </FormField>
          </div>
          <FormField label="Email" error={errors.email?.message} required>
            <Input
              type="email"
              autoComplete="off"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
              })}
            />
          </FormField>
          <FormField label="Temporary password" hint="At least 6 characters. Share it with the user securely." error={errors.password?.message} required>
            <Input
              type="password"
              autoComplete="new-password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />
          </FormField>
        </FormSection>

        <FormSection title="Role" description="Students and faculty also need a department and an institutional ID.">
          <FormField label="Role" required>
            <Select {...register('role')}>
              <option value={Role.STUDENT}>Student</option>
              <option value={Role.FACULTY}>Faculty</option>
              <option value={Role.ADMIN}>Administrator</option>
            </Select>
          </FormField>

          {needsProfile && (
            <FormField label="Department" error={errors.departmentId?.message} required>
              <Select {...register('departmentId', { validate: (v, values) => !(values.role !== Role.ADMIN && !v) || 'Select a department' })}>
                <option value="">Select a department</option>
                {departmentOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          {role === Role.STUDENT && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Roll number" error={errors.rollNumber?.message} required>
                <Input
                  autoComplete="off"
                  placeholder="e.g. CSE2024051"
                  {...register('rollNumber', { validate: (v, values) => values.role !== Role.STUDENT || Boolean(v.trim()) || 'Roll number is required' })}
                />
              </FormField>
              <FormField label="Semester" error={errors.semester?.message} required>
                <Select {...register('semester', { valueAsNumber: true })}>
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Semester {i + 1}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          )}

          {role === Role.FACULTY && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Employee ID" error={errors.employeeId?.message} required>
                <Input
                  autoComplete="off"
                  placeholder="e.g. FAC011"
                  {...register('employeeId', { validate: (v, values) => values.role !== Role.FACULTY || Boolean(v.trim()) || 'Employee ID is required' })}
                />
              </FormField>
              <FormField label="Designation">
                <Input autoComplete="off" placeholder="e.g. Assistant Professor" {...register('designation')} />
              </FormField>
            </div>
          )}
        </FormSection>

        {error && <Alert tone="danger">{error}</Alert>}
      </form>
    </Dialog>
  );
}
