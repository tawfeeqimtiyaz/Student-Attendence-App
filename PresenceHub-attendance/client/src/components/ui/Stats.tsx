// ============================================
// StatCard (KPI tile) and Meter (ratio against 100%)
// ============================================

import React from 'react';
import { cn } from '../../utils/cn';
import type { Tone } from './Badge';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  /** Supporting context, e.g. "of 42 classes" or the period the number covers. */
  hint?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function StatCard({ label, value, hint, icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn('flex min-w-0 flex-col rounded-xl border border-line bg-card p-4 shadow-xs sm:p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[13px] font-medium text-fg-muted">{label}</p>
        {Icon && <Icon className="size-4 shrink-0 text-fg-subtle" aria-hidden />}
      </div>
      <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-fg">{value}</p>
      {hint && <p className="mt-1 line-clamp-2 text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}

const meterFill: Record<Tone, string> = {
  neutral: 'bg-fg-subtle',
  brand: 'bg-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

const meterTrack: Record<Tone, string> = {
  neutral: 'bg-muted',
  brand: 'bg-brand-soft',
  success: 'bg-success-soft',
  warning: 'bg-warning-soft',
  danger: 'bg-danger-soft',
  info: 'bg-info-soft',
};

interface MeterProps {
  /** 0–100 */
  value: number;
  label: string;
  tone?: Tone;
  className?: string;
}

/** Horizontal meter; the track is a lighter step of the fill's hue. */
export function Meter({ value, label, tone = 'brand', className }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn('h-2 w-full overflow-hidden rounded-full', meterTrack[tone], className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', meterFill[tone])} style={{ width: `${clamped}%` }} />
    </div>
  );
}
