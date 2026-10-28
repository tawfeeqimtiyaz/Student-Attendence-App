// ============================================
// Loading / empty / error states
// ============================================

import React from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2, RotateCw, TriangleAlert } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-fg-subtle', className)}>
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-md', className)} />;
}

/** Placeholder rows for tables and lists while data loads. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={cn('divide-y divide-line', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-1/5" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Generic page skeleton: header + stat row + panel. */
export function PageSkeleton({ stats = 0 }: { stats?: number }) {
  return (
    <div role="status" aria-label="Loading page" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {stats > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: stats }, (_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-xl" />
          ))}
        </div>
      )}
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 text-center', compact ? 'py-8' : 'py-14', className)}>
      {Icon && (
        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-subtle text-fg-subtle">
          <Icon className="size-5" />
        </span>
      )}
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-fg-subtle">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  title = "Couldn't load this data",
  className,
}: {
  message?: string | null;
  onRetry?: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <div role="alert" className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger-text">
        <AlertCircle className="size-5" />
      </span>
      <p className="text-sm font-semibold text-fg">{title}</p>
      {message && <p className="mt-1 max-w-sm text-[13px] text-fg-subtle">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" leftIcon={<RotateCw />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

const alertTones = {
  info: { cls: 'border-info/25 bg-info-soft text-info-text', icon: Info },
  success: { cls: 'border-success/25 bg-success-soft text-success-text', icon: CheckCircle2 },
  warning: { cls: 'border-warning/30 bg-warning-soft text-warning-text', icon: TriangleAlert },
  danger: { cls: 'border-danger/25 bg-danger-soft text-danger-text', icon: AlertCircle },
};

/** Inline message banner. Use role="alert" (default for danger) for urgent messages. */
export function Alert({
  tone = 'info',
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof alertTones;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const { cls, icon: Icon } = alertTones[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-[13px]', cls, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
