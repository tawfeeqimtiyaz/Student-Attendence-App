import React, { useMemo } from 'react';
import { CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GraduationCap } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import type { StudentResult } from '../../types/api';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/Stats';
import { Table, TBody, TD, TH, THead, TR } from '../../components/ui/Table';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/ui/States';

const SERIES = [
  { key: 'sgpa', label: 'SGPA', color: 'var(--color-chart-1)' },
  { key: 'cgpa', label: 'CGPA', color: 'var(--color-chart-2)' },
] as const;

const chronological = (a: StudentResult, b: StudentResult) => a.academicYear.localeCompare(b.academicYear) || a.semester - b.semester;

interface Point {
  term: string;
  label: string;
  sgpa: number;
  cgpa: number;
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-card px-3 py-2 text-[13px] shadow-md">
      <p className="mb-1 font-medium text-fg">{p.term}</p>
      {SERIES.map((s) => (
        <p key={s.key} className="flex items-center gap-2 text-fg-muted">
          <span aria-hidden className="inline-block h-0.5 w-3 rounded" style={{ background: s.color }} />
          {s.label} <span className="ml-auto pl-3 font-semibold tabular-nums text-fg">{p[s.key].toFixed(2)}</span>
        </p>
      ))}
    </div>
  );
}

function GpaTrend({ results }: { results: StudentResult[] }) {
  const points: Point[] = results.map((r) => ({ term: `Semester ${r.semester} · ${r.academicYear}`, label: `Sem ${r.semester}`, sgpa: r.sgpa, cgpa: r.cgpa }));
  const last = points.length - 1;
  // Keep the two end labels apart: the higher series labels above its point, the lower below.
  const sgpaOnTop = points[last].sgpa >= points[last].cgpa;
  const labelDy = (key: 'sgpa' | 'cgpa') => ((key === 'sgpa') === sgpaOnTop ? -8 : 14);
  return (
    <figure>
      <div className="mb-3 flex flex-wrap gap-4 text-[13px] text-fg-muted" aria-hidden>
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-2">
            <span className="inline-block h-0.5 w-4 rounded" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="h-64" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 16, right: 40, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <XAxis dataKey="label" interval={0} padding={{ left: 16, right: 16 }} tickLine={false} axisLine={{ stroke: 'var(--color-line)' }} tick={{ fill: 'var(--color-fg-subtle)', fontSize: 12 }} />
            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-fg-subtle)', fontSize: 12 }} />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--color-line-strong)' }} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 4, fill: s.color, stroke: 'var(--color-card)', strokeWidth: 2 }}
                activeDot={{ r: 5, stroke: 'var(--color-card)', strokeWidth: 2 }}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey={s.key}
                  content={({ x, y, value, index }) =>
                    index === last ? (
                      <text x={Number(x) + 8} y={Number(y) + labelDy(s.key)} fontSize={12} fill="var(--color-fg-muted)">
                        {Number(value).toFixed(2)}
                      </text>
                    ) : null
                  }
                />
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        SGPA and CGPA by semester. The table below lists every value.
      </figcaption>
    </figure>
  );
}

export const MyResults: React.FC = () => {
  const { data, error, isLoading, reload } = useApiQuery(studentApi.getResults, []);
  const results = useMemo(() => [...(data ?? [])].sort(chronological), [data]);
  const latest = results[results.length - 1];

  if (isLoading) return <PageSkeleton stats={3} />;
  if (error) {
    return (
      <Page>
        <PageHeader title="Results" />
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title="Results" description="Your semester grade point averages and credits." />

      {results.length === 0 ? (
        <Card>
          <EmptyState icon={GraduationCap} title="No results yet" description="Semester results appear here once they are recorded." />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Current CGPA" value={latest.cgpa.toFixed(2)} hint={`As of semester ${latest.semester}, ${latest.academicYear}`} />
            <StatCard label="Latest SGPA" value={latest.sgpa.toFixed(2)} hint={`Semester ${latest.semester}`} />
            <StatCard
              label="Credits earned"
              value={results.reduce((sum, r) => sum + r.earnedCredits, 0)}
              hint={`of ${results.reduce((sum, r) => sum + r.totalCredits, 0)} attempted`}
            />
          </div>

          {results.length >= 2 && (
            <Card>
              <CardHeader title="GPA over time" description="Out of 10" />
              <div className="mt-4">
                <GpaTrend results={results} />
              </div>
            </Card>
          )}

          <Card flush>
            <Table label="Semester results" minWidth={420}>
              <THead>
                <tr>
                  <TH>Semester</TH>
                  <TH>Academic year</TH>
                  <TH alignTo="right">SGPA</TH>
                  <TH alignTo="right">CGPA</TH>
                  <TH alignTo="right">Credits</TH>
                </tr>
              </THead>
              <TBody>
                {[...results].reverse().map((r) => (
                  <TR key={r.id}>
                    <TD className="whitespace-nowrap font-medium">Semester {r.semester}</TD>
                    <TD className="text-fg-muted">{r.academicYear}</TD>
                    <TD alignTo="right" className="font-semibold tabular-nums">
                      {r.sgpa.toFixed(2)}
                    </TD>
                    <TD alignTo="right" className="tabular-nums">
                      {r.cgpa.toFixed(2)}
                    </TD>
                    <TD alignTo="right" className="tabular-nums text-fg-muted">
                      {r.earnedCredits} / {r.totalCredits}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </>
      )}
    </Page>
  );
};
