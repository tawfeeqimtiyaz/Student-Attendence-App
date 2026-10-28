import React, { useMemo } from 'react';
import { Wallet } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { FEE_STATUS_META } from '../../constants/status';
import { formatCurrency, formatDate, humanize } from '../../utils/format';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/Stats';
import { Badge } from '../../components/ui/Badge';
import { Table, TBody, TD, TH, THead, TR, TableMessage } from '../../components/ui/Table';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/ui/States';

export const MyFees: React.FC = () => {
  const { data, error, isLoading, reload } = useApiQuery(studentApi.getFees, []);

  const totals = useMemo(() => {
    const fees = data ?? [];
    const billed = fees.reduce((sum, f) => sum + f.amount, 0);
    const paid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    return { billed, paid, balance: billed - paid };
  }, [data]);

  if (isLoading) return <PageSkeleton stats={3} />;
  if (error) {
    return (
      <Page>
        <PageHeader title="Fees" />
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title="Fees" description="Your fees and fines, what you've paid and what remains due." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total billed" value={formatCurrency(totals.billed)} hint={`${data.length} fee items`} />
        <StatCard label="Paid" value={formatCurrency(totals.paid)} />
        <StatCard label="Balance" value={formatCurrency(totals.balance)} hint={totals.balance > 0 ? 'Remaining to be paid' : 'Nothing outstanding'} />
      </div>

      <Card flush>
        <Table label="Fees" minWidth={720}>
          <THead>
            <tr>
              <TH>Fee</TH>
              <TH>Term</TH>
              <TH>Due date</TH>
              <TH alignTo="right">Amount</TH>
              <TH alignTo="right">Paid</TH>
              <TH alignTo="right">Balance</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {data.length === 0 ? (
              <TableMessage colSpan={7}>
                <EmptyState icon={Wallet} title="No fees on record" />
              </TableMessage>
            ) : (
              data.map((fee) => {
                const status = FEE_STATUS_META[fee.status] ?? { label: humanize(fee.status), tone: 'neutral' as const, icon: undefined };
                return (
                  <TR key={fee.id}>
                    <TD className="font-medium">{humanize(fee.type)}</TD>
                    <TD className="whitespace-nowrap text-fg-muted">
                      {fee.academicYear} · Sem {fee.semester}
                    </TD>
                    <TD className="whitespace-nowrap text-fg-muted">{formatDate(fee.dueDate)}</TD>
                    <TD alignTo="right" className="tabular-nums">
                      {formatCurrency(fee.amount)}
                    </TD>
                    <TD alignTo="right" className="tabular-nums text-fg-muted">
                      {formatCurrency(fee.paidAmount)}
                    </TD>
                    <TD alignTo="right" className="font-medium tabular-nums">
                      {formatCurrency(fee.amount - fee.paidAmount)}
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
      </Card>
    </Page>
  );
};
