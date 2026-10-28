import { GraduationCap } from 'lucide-react';
import { cn } from '../../utils/cn';

/** PresenceHub mark — the existing graduation-cap logo on the brand color. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white shadow-xs', className)}>
      <GraduationCap className="size-[18px]" />
    </span>
  );
}

export function BrandLockup({ subtitle, collapsed = false }: { subtitle?: string; collapsed?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <BrandMark />
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[15px] font-semibold tracking-tight text-fg">PresenceHub</p>
          {subtitle && <p className="truncate text-[11px] font-medium text-fg-subtle">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
