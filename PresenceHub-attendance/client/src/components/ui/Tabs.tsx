// ============================================
// Tabs / segmented control — WAI-ARIA tabs with roving tabindex
// ============================================

import React, { useRef } from 'react';
import { cn } from '../../utils/cn';

export interface TabItem<V extends string> {
  value: V;
  label: React.ReactNode;
  count?: number;
}

interface TabsProps<V extends string> {
  items: TabItem<V>[];
  value: NoInfer<V>;
  onChange: (value: NoInfer<V>) => void;
  label: string;
  className?: string;
  /** id prefix to connect tabs with their panel via aria-controls */
  idPrefix?: string;
}

export function Tabs<V extends string>({ items, value, onChange, label, className, idPrefix }: TabsProps<V>) {
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const index = items.findIndex((i) => i.value === value);
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % items.length;
    if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = items.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onChange(items[next].value);
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-subtle p-1 ring-1 ring-inset ring-line', className)}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={idPrefix ? `${idPrefix}-tab-${item.value}` : undefined}
            aria-controls={idPrefix ? `${idPrefix}-panel` : undefined}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-medium transition-colors',
              selected ? 'bg-card text-fg shadow-xs ring-1 ring-line' : 'text-fg-muted hover:text-fg'
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn('rounded px-1.5 text-[11px] tabular-nums', selected ? 'bg-subtle text-fg-muted' : 'text-fg-subtle')}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
