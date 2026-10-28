// ============================================
// StudentPicker — choose a student from the faculty member's section rosters.
// A filter box narrows a native <select> (accessible and mobile-friendly).
// ============================================

import React, { useMemo, useState } from 'react';
import type { FacultySection } from '../../types/api';
import { fullName } from '../../utils/format';
import { FormField, Input, Select } from '../ui/Form';

export interface RosterStudent {
  id: string;
  name: string;
  rollNumber: string;
  sections: string[];
}

export function uniqueStudents(sections: FacultySection[] | undefined): RosterStudent[] {
  const map = new Map<string, RosterStudent>();
  for (const section of sections ?? []) {
    for (const e of section.enrollments) {
      const existing = map.get(e.studentId);
      const label = `${section.course.code}-${section.name}`;
      if (existing) existing.sections.push(label);
      else map.set(e.studentId, { id: e.studentId, name: fullName(e.student.user), rollNumber: e.student.rollNumber, sections: [label] });
    }
  }
  return [...map.values()].sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }));
}

interface StudentPickerProps {
  students: RosterStudent[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
  disabled?: boolean;
  selectProps?: React.ComponentProps<'select'>;
}

export function StudentPicker({ students, value, onChange, error, disabled, selectProps }: StudentPickerProps) {
  const [filter, setFilter] = useState('');
  const options = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = q ? students.filter((s) => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q)) : students;
    // Keep the current selection visible even when filtered out.
    const selected = students.find((s) => s.id === value);
    return selected && !list.includes(selected) ? [selected, ...list] : list;
  }, [students, filter, value]);
  const selected = students.find((s) => s.id === value);

  return (
    <div className="space-y-2">
      <FormField
        label="Student"
        required
        error={error}
        hint={selected ? `Enrolled in ${selected.sections.join(', ')}` : `${students.length} students across your sections`}
      >
        <Select {...selectProps} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
          <option value="">{options.length ? 'Select a student…' : 'No students match the filter'}</option>
          {options.map((s) => (
            <option key={s.id} value={s.id}>
              {s.rollNumber} — {s.name}
            </option>
          ))}
        </Select>
      </FormField>
      <Input
        type="search"
        aria-label="Filter the student list by name or roll number"
        placeholder="Filter by name or roll number"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        disabled={disabled}
        className="h-8 text-[13px]"
      />
    </div>
  );
}
