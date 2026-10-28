import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium select-none ' +
  'transition-[background-color,border-color,color,box-shadow] duration-150 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ' +
  'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-fg-inverse shadow-xs hover:bg-brand-hover active:brightness-95',
  secondary: 'border border-line bg-card text-fg shadow-xs hover:bg-subtle hover:border-line-strong active:bg-muted',
  ghost: 'text-fg-muted hover:bg-subtle hover:text-fg active:bg-muted',
  danger: 'bg-danger text-white shadow-xs hover:bg-danger-hover active:brightness-95',
  'danger-ghost': 'text-danger-text hover:bg-danger-soft',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] [&_svg]:size-3.5',
  md: 'h-9 px-3.5 text-sm [&_svg]:size-4',
  lg: 'h-10 px-4 text-sm [&_svg]:size-4',
};

const iconSizes: Record<Size, string> = {
  sm: 'size-8 [&_svg]:size-4',
  md: 'size-9 [&_svg]:size-[18px]',
  lg: 'size-10 [&_svg]:size-5',
};

export function buttonClasses({ variant = 'primary', size = 'md', className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner, disables the button and sets aria-busy. */
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : leftIcon}
      {children}
    </button>
  );
}

export interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  leftIcon?: React.ReactNode;
}

export function ButtonLink({ variant = 'secondary', size = 'md', leftIcon, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {leftIcon}
      {children}
    </Link>
  );
}

export interface IconButtonProps extends Omit<React.ComponentProps<'button'>, 'children'> {
  /** Accessible name — required because the button has no visible text. */
  label: string;
  icon: React.ReactNode;
  variant?: Variant;
  size?: Size;
}

export function IconButton({ label, icon, variant = 'ghost', size = 'md', className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(base, variants[variant], iconSizes[size], 'px-0', className)}
      {...props}
    >
      {icon}
    </button>
  );
}
