import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { disciplineMeta } from '../../constants/status';
import { formatDate } from '../../utils/format';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/States';

export const MyDiscipline: React.FC = () => {
  const { data, error, isLoading, reload } = useApiQuery(studentApi.getDiscipline, []);

  return (
    <Page>
      <PageHeader title="Discipline" description="Disciplinary records filed about you, and whether they've been resolved." />

      {isLoading ? (
        <Card flush>
          <SkeletonRows rows={3} />
        </Card>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <EmptyState icon={ShieldCheck} title="No disciplinary records" description="You have a clean record." />
        </Card>
      ) : (
        <ul className="space-y-4">
          {data.map((record) => {
            const meta = disciplineMeta(record.actionTaken);
            return (
              <li key={record.id}>
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={meta.tone} icon={meta.icon}>
                        {meta.label}
                      </Badge>
                      {record.isResolved ? <Badge tone="success">Resolved</Badge> : <Badge tone="warning">Under review</Badge>}
                    </div>
                    <p className="text-[13px] text-fg-subtle">
                      Incident on <time dateTime={record.incidentDate}>{formatDate(record.incidentDate, 'd MMMM yyyy')}</time>
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-fg">{record.description}</p>
                  {record.actionDetails && (
                    <div className="mt-3 rounded-lg bg-subtle px-4 py-3">
                      <p className="text-xs font-medium text-fg-muted">Action details</p>
                      <p className="mt-0.5 text-[13px] text-fg">{record.actionDetails}</p>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
};
