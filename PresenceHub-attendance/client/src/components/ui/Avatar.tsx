import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { initials } from '../../utils/format';

const sizes = {
  sm: 'size-7 text-[11px]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
  xl: 'size-16 text-xl',
};

interface AvatarProps {
  person?: { firstName?: string; lastName?: string } | null;
  size?: keyof typeof sizes;
  className?: string;
}

/** Initials avatar. Decorative — the person's name is always rendered next to it. */
export function Avatar({ person, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full bg-brand-soft font-semibold text-brand-text',
        sizes[size],
        className
      )}
    >
      {initials(person)}
    </span>
  );
}

/** Avatar + name + secondary line, used in tables and lists. */
export function PersonCell({
  person,
  secondary,
  size = 'md',
}: {
  person?: { firstName?: string; lastName?: string } | null;
  secondary?: ReactNode;
  size?: keyof typeof sizes;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar person={person} size={size} />
      <div className="min-w-0">
        <p className="truncate font-medium text-fg">
          {person?.firstName} {person?.lastName}
        </p>
        {secondary && <p className="truncate text-xs text-fg-subtle">{secondary}</p>}
      </div>
    </div>
  );
}
