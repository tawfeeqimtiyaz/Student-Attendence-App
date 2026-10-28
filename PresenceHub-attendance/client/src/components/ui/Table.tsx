// ============================================
// Table primitives — semantic markup, consistent density, contained
// horizontal scroll on small screens, sortable headers with aria-sort.
// ============================================

import React from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { SortState } from '../../hooks/useSort';

export function Table({ children, className, label, minWidth = 640 }: { children: React.ReactNode; className?: string; label: string; minWidth?: number }) {
  return (
    <div className={cn('w-full overflow-x-auto', className)} role="region" aria-label={label} tabIndex={0}>
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-line bg-subtle/70 text-xs font-medium text-fg-muted">{children}</thead>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function TR({ children, className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr className={cn('transition-colors hover:bg-subtle/60', className)} {...props}>
      {children}
    </tr>
  );
}

const align = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function TH({
  children,
  className,
  alignTo = 'left',
  srOnly,
}: {
  children: React.ReactNode;
  className?: string;
  alignTo?: keyof typeof align;
  srOnly?: boolean;
}) {
  return (
    <th scope="col" className={cn('h-10 whitespace-nowrap px-4 font-medium first:pl-5 last:pr-5', align[alignTo], className)}>
      {srOnly ? <span className="sr-only">{children}</span> : children}
    </th>
  );
}

export function TD({ children, className, alignTo = 'left', ...props }: React.ComponentProps<'td'> & { alignTo?: keyof typeof align }) {
  return (
    <td className={cn('px-4 py-3 align-middle text-fg first:pl-5 last:pr-5', align[alignTo], className)} {...props}>
      {children}
    </td>
  );
}

interface SortableTHProps<K extends string> {
  label: string;
  sortKey: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
  alignTo?: keyof typeof align;
  className?: string;
}

export function SortableTH<K extends string>({ label, sortKey, sort, onSort, alignTo = 'left', className }: SortableTHProps<K>) {
  const active = sort.key === sortKey;
  const Icon = !active ? ChevronsUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('h-10 whitespace-nowrap px-4 font-medium first:pl-5 last:pr-5', align[alignTo], className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          '-mx-1.5 inline-flex items-center gap-1 rounded px-1.5 py-1 hover:bg-muted hover:text-fg',
          active && 'text-fg',
          alignTo === 'right' && 'flex-row-reverse'
        )}
      >
        {label}
        <Icon className={cn('size-3.5', !active && 'opacity-50')} aria-hidden />
      </button>
    </th>
  );
}

/** Empty / error / loading row spanning the table. */
export function TableMessage({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan}>{children}</td>
    </tr>
  );
}

/** Filters row above a table inside a flush card. */
export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 border-b border-line px-5 py-3.5 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      {children}
    </div>
  );
}
