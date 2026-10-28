// ============================================
// Section selection shared by faculty workflows.
// The chosen section lives in the URL (?section=…) so it survives
// refreshes and can be linked to from the dashboard.
// ============================================

import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FacultySection, SectionEnrollment } from '../../types/api';
import { FormField, Select } from '../ui/Form';
import { Skeleton } from '../ui/States';

export function sectionLabel(section: Pick<FacultySection, 'name' | 'course'>) {
  return `${section.course.code} · ${section.course.name} — Section ${section.name}`;
}

export function sortedRoster(section?: FacultySection | null): SectionEnrollment[] {
  if (!section) return [];
  return [...section.enrollments].sort((a, b) => a.student.rollNumber.localeCompare(b.student.rollNumber, undefined, { numeric: true }));
}

/** Read/write one search param without dropping the others. */
export function useSearchParam(key: string): [string, (value: string | null) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? '';
  const setValue = useCallback(
    (next: string | null) =>
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (next) updated.set(key, next);
          else updated.delete(key);
          return updated;
        },
        { replace: true }
      ),
    [key, setParams]
  );
  return [value, setValue];
}

/** Update several search params in one navigation (separate calls would overwrite each other). */
export function useUpdateSearchParams() {
  const [, setParams] = useSearchParams();
  return useCallback(
    (patch: Record<string, string | null>) =>
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value) updated.set(key, value);
            else updated.delete(key);
          }
          return updated;
        },
        { replace: true }
      ),
    [setParams]
  );
}

interface SectionPickerProps {
  sections: FacultySection[] | undefined;
  isLoading: boolean;
  value: string;
  onChange: (sectionId: string) => void;
  className?: string;
}

export function SectionPicker({ sections, isLoading, value, onChange, className }: SectionPickerProps) {
  if (isLoading && !sections) {
    return (
      <div className={className}>
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="h-9" />
      </div>
    );
  }
  const selected = sections?.find((s) => s.id === value);
  return (
    <FormField
      label="Section"
      className={className}
      hint={selected ? `${selected.enrollments.length} students · ${selected.academicYear} · Semester ${selected.semester}` : undefined}
    >
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select a section…</option>
        {(sections ?? []).map((s) => (
          <option key={s.id} value={s.id}>
            {sectionLabel(s)}
          </option>
        ))}
      </Select>
    </FormField>
  );
}
