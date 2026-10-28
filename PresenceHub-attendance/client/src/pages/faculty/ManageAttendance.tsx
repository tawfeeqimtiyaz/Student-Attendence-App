import React, { useCallback, useState } from 'react';
import { ClipboardCheck, Library } from 'lucide-react';
import { facultyApi } from '../../api/faculty.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { todayISO } from '../../utils/format';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { FormField, Input } from '../../components/ui/Form';
import { Tabs } from '../../components/ui/Tabs';
import { Alert, EmptyState, ErrorState, SkeletonRows } from '../../components/ui/States';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { SectionPicker, useSearchParam, useUpdateSearchParams } from '../../components/faculty/SectionPicker';
import { AttendanceSheet } from '../../components/faculty/AttendanceSheet';
import { AttendanceHistory } from '../../components/faculty/AttendanceHistory';

type View = 'mark' | 'history';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const ManageAttendance: React.FC = () => {
  const sections = useApiQuery(facultyApi.getSections, []);
  const [sectionId, setSectionId] = useSearchParam('section');
  const [dateParam, setDateParam] = useSearchParam('date');
  const [viewParam, setViewParam] = useSearchParam('view');
  const updateParams = useUpdateSearchParams();
  const date = DATE_PATTERN.test(dateParam) ? dateParam : todayISO();
  const view: View = viewParam === 'history' ? 'history' : 'mark';

  const section = sections.data?.find((s) => s.id === sectionId);
  const existing = useApiQuery(
    section && view === 'mark' ? () => facultyApi.getAttendanceHistory(section.id, date) : null,
    [section?.id, date, view]
  );

  // ---- Unsaved changes ----
  const [isDirty, setIsDirty] = useState(false);
  const [pendingChange, setPendingChange] = useState<(() => void) | null>(null);
  const guard = useUnsavedChangesGuard(isDirty);
  const onDirtyChange = useCallback((dirty: boolean) => setIsDirty(dirty), []);

  const guarded = (change: () => void) => {
    if (isDirty) setPendingChange(() => change);
    else change();
  };
  const discardAndContinue = () => {
    setIsDirty(false);
    pendingChange?.();
    setPendingChange(null);
  };

  const isFuture = date > todayISO();

  return (
    <Page>
      <PageHeader title="Attendance" description="Record daily attendance for your sections, or review and correct earlier days." />

      {sections.error ? (
        <Card>
          <ErrorState message={sections.error} onRetry={sections.reload} />
        </Card>
      ) : !sections.isLoading && sections.data?.length === 0 ? (
        <Card>
          <EmptyState icon={Library} title="No sections assigned to you" description="Attendance can be taken once an administrator assigns you a course section." />
        </Card>
      ) : (
        <>
          <Card>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:items-start">
              <SectionPicker
                sections={sections.data}
                isLoading={sections.isLoading}
                value={sectionId}
                onChange={(id) => guarded(() => setSectionId(id || null))}
              />
              <FormField
                label="Date"
                hint={view === 'history' ? 'Not used in history view' : date === todayISO() ? 'Today' : undefined}
                labelAside={
                  view === 'mark' &&
                  date !== todayISO() && (
                    <button
                      type="button"
                      onClick={() => guarded(() => setDateParam(null))}
                      className="rounded text-[13px] font-medium text-brand-text hover:underline"
                    >
                      Today
                    </button>
                  )
                }
              >
                <Input
                  type="date"
                  value={date}
                  disabled={view === 'history'}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (DATE_PATTERN.test(value)) guarded(() => setDateParam(value === todayISO() ? null : value));
                  }}
                />
              </FormField>
            </div>
            {isFuture && view === 'mark' && (
              <Alert tone="warning" className="mt-4">
                This date is in the future. Make sure you meant to record attendance ahead of time.
              </Alert>
            )}
          </Card>

          {!section ? (
            <Card>
              <EmptyState icon={ClipboardCheck} title="Select a section to begin" description="Its enrolled students will be listed here for marking." />
            </Card>
          ) : (
            <Card flush>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
                <Tabs
                  label="Attendance view"
                  idPrefix="attendance"
                  value={view}
                  onChange={(next) => guarded(() => setViewParam(next === 'mark' ? null : next))}
                  items={[
                    { value: 'mark', label: 'Take attendance' },
                    { value: 'history', label: 'History' },
                  ]}
                />
                <p className="text-[13px] text-fg-muted">
                  {section.course.code} · Section {section.name}
                </p>
              </div>

              <div role="tabpanel" id="attendance-panel" aria-labelledby={`attendance-tab-${view}`}>
                {view === 'history' ? (
                  <AttendanceHistory
                    section={section}
                    onEditDate={(d) => updateParams({ date: d === todayISO() ? null : d, view: null })}
                  />
                ) : existing.isLoading && !existing.data ? (
                  <SkeletonRows rows={8} />
                ) : existing.error ? (
                  // Without the saved records we can't show the true state, so editing is blocked.
                  <ErrorState
                    title="Couldn't load saved attendance for this date"
                    message={`${existing.error} Attendance can't be edited until the saved records load.`}
                    onRetry={existing.reload}
                  />
                ) : (
                  <AttendanceSheet
                    key={`${section.id}|${date}`}
                    section={section}
                    date={date}
                    existing={existing.data ?? []}
                    onSaved={existing.reload}
                    onDirtyChange={onDirtyChange}
                  />
                )}
              </div>
            </Card>
          )}
        </>
      )}

      <ConfirmDialog
        open={pendingChange !== null || guard.isBlocked}
        onCancel={() => {
          setPendingChange(null);
          guard.cancel();
        }}
        onConfirm={() => {
          if (guard.isBlocked) {
            setIsDirty(false);
            guard.proceed();
          } else discardAndContinue();
        }}
        title="Discard unsaved attendance?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
      >
        <p>You have attendance changes that haven't been saved. If you continue, they will be lost.</p>
      </ConfirmDialog>
    </Page>
  );
};
