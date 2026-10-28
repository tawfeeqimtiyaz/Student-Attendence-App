import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.ComponentProps<'section'> {
  /** Remove inner padding (for tables / lists that run edge to edge). */
  flush?: boolean;
}

export function Card({ className, flush = false, children, ...props }: CardProps) {
  return (
    <section
      className={cn('rounded-xl border border-line bg-card shadow-xs', !flush && 'p-5', className)}
      {...props}
    >
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  /** Heading level — defaults to h2 (pages own the h1). */
  as?: 'h2' | 'h3';
}

export function CardHeader({ title, description, actions, icon: Icon, className, as: Heading = 'h2' }: CardHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-2', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-subtle text-fg-muted">
            <Icon className="size-4" />
          </span>
        )}
        <div className="min-w-0">
          <Heading className="text-[15px] font-semibold leading-6 text-fg">{title}</Heading>
          {description && <p className="mt-0.5 text-[13px] text-fg-subtle">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Header row used inside a `flush` card, separated from content by a border. */
export function CardBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('border-b border-line px-5 py-4', className)}>{children}</div>;
}
