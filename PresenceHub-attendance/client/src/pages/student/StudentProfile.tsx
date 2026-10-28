import React from 'react';
import { authApi } from '../../api/auth.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatDate, formatTimestamp, fullName } from '../../utils/format';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { ErrorState, PageSkeleton } from '../../components/ui/States';

function Detail({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-[13px] text-fg-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-fg sm:col-span-2 sm:mt-0">{value || <span className="text-fg-subtle">Not provided</span>}</dd>
    </div>
  );
}

export const StudentProfile: React.FC = () => {
  const { data, error, isLoading, reload } = useApiQuery(() => authApi.getProfile().then((r) => r.data), []);

  if (isLoading) return <PageSkeleton />;
  if (error || !data) {
    return (
      <Page>
        <PageHeader title="Profile" />
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      </Page>
    );
  }
  const student = data.student;

  return (
    <Page>
      <PageHeader title="Profile" description="Your account and academic details as held by the institution." />

      <Card>
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar person={data} size="xl" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-fg">{fullName(data)}</h2>
            <p className="text-sm text-fg-muted">{data.email}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge tone="brand">Student</Badge>
              {data.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Academic" />
          <dl className="mt-3 divide-y divide-line">
            <Detail label="Roll number" value={student?.rollNumber && <span className="font-mono">{student.rollNumber}</span>} />
            <Detail label="Department" value={student?.department && `${student.department.name} (${student.department.code})`} />
            <Detail label="Semester" value={student?.semester} />
            <Detail label="Section" value={student?.section} />
          </dl>
        </Card>
        <Card>
          <CardHeader title="Personal" />
          <dl className="mt-3 divide-y divide-line">
            <Detail label="Phone" value={student?.phone} />
            <Detail label="Date of birth" value={student?.dateOfBirth && formatDate(student.dateOfBirth, 'd MMMM yyyy')} />
            <Detail label="Address" value={student?.address} />
            <Detail label="Guardian" value={student?.guardianName && `${student.guardianName}${student.guardianPhone ? ` · ${student.guardianPhone}` : ''}`} />
            <Detail label="Member since" value={formatTimestamp(data.createdAt, 'd MMMM yyyy')} />
          </dl>
        </Card>
      </div>
      <p className="text-xs text-fg-subtle">To correct any of these details, contact your institution's administration office.</p>
    </Page>
  );
};
