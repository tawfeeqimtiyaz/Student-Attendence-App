import React from 'react';
import { AlertTriangle, Info, Megaphone, OctagonAlert } from 'lucide-react';
import type { StudentNotification } from '../../types/api';
import { formatTimestamp } from '../../utils/format';
import { cn } from '../../utils/cn';
import { Badge, type Tone } from '../ui/Badge';

const TYPE_META: Record<StudentNotification['type'], { label: string; tone: Tone; icon: React.ComponentType<{ className?: string }> }> = {
  INFO: { label: 'Info', tone: 'info', icon: Info },
  WARNING: { label: 'Warning', tone: 'warning', icon: AlertTriangle },
  URGENT: { label: 'Urgent', tone: 'danger', icon: OctagonAlert },
  ANNOUNCEMENT: { label: 'Announcement', tone: 'brand', icon: Megaphone },
};

const iconTone: Record<Tone, string> = {
  info: 'bg-info-soft text-info-text',
  warning: 'bg-warning-soft text-warning-text',
  danger: 'bg-danger-soft text-danger-text',
  brand: 'bg-brand-soft text-brand-text',
  success: 'bg-success-soft text-success-text',
  neutral: 'bg-subtle text-fg-muted',
};

export function NotificationItem({ notification, compact = false }: { notification: StudentNotification; compact?: boolean }) {
  const meta = TYPE_META[notification.type] ?? TYPE_META.INFO;
  const Icon = meta.icon;
  return (
    <article className={cn('flex gap-3', compact ? 'px-5 py-3' : 'px-5 py-4')}>
      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', iconTone[meta.tone])}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-sm font-semibold text-fg">{notification.title}</h3>
          {!compact && <Badge tone={meta.tone}>{meta.label}</Badge>}
        </div>
        <p className={cn('mt-0.5 text-[13px] text-fg-muted', compact && 'line-clamp-2')}>{notification.message}</p>
        <p className="mt-1 text-xs text-fg-subtle">
          <time dateTime={notification.createdAt}>{formatTimestamp(notification.createdAt, 'd MMM yyyy, HH:mm')}</time>
        </p>
      </div>
    </article>
  );
}
