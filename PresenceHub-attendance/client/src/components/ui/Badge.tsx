import React from 'react';
import { cn } from '../../utils/cn';

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'bg-subtle text-fg-muted ring-line',
  brand: 'bg-brand-soft text-brand-text ring-brand/20',
  success: 'bg-success-soft text-success-text ring-success/20',
  warning: 'bg-warning-soft text-warning-text ring-warning/25',
  danger: 'bg-danger-soft text-danger-text ring-danger/20',
  info: 'bg-info-soft text-info-text ring-info/20',
};

interface BadgeProps {
  tone?: Tone;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}

/** Status pill. Always carries text so meaning never relies on color alone. */
export function Badge({ tone = 'neutral', icon: Icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className
      )}
    >
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
      {children}
    </span>
  );
}
