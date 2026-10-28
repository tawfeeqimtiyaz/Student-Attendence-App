// ============================================
// Dropdown menu — WAI-ARIA menu button pattern
// (arrow keys, Home/End, Escape returns focus, click-outside closes)
// ============================================

import React, { useEffect, useId, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

interface MenuProps {
  /** Renders the trigger; spread `props` onto a <button>. */
  trigger: (props: React.ComponentProps<'button'> & { 'aria-expanded': boolean }) => React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

export function Menu({ trigger, children, align = 'end', className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);

  useEffect(() => {
    if (!open) return;
    items()[0]?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        list[(index + 1) % list.length]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        list[(index - 1 + list.length) % list.length]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        list[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        list[list.length - 1]?.focus();
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        close(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      {trigger({
        ref: triggerRef,
        type: 'button',
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
        onClick: () => setOpen((v) => !v),
        onKeyDown: (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        },
      })}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          onKeyDown={onKeyDown}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('[role="menuitem"]')) close(false);
          }}
          className={cn(
            'absolute top-full z-50 mt-2 min-w-56 origin-top rounded-xl border border-line bg-card p-1.5 shadow-lg animate-pop-in',
            align === 'end' ? 'right-0' : 'left-0',
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface MenuItemProps extends Omit<React.ComponentProps<'button'>, 'role'> {
  icon?: React.ComponentType<{ className?: string }>;
  tone?: 'default' | 'danger';
}

export function MenuItem({ icon: Icon, tone = 'default', className, children, ...props }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      className={cn(
        'flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm outline-none transition-colors',
        tone === 'danger' ? 'text-danger-text hover:bg-danger-soft focus:bg-danger-soft' : 'text-fg hover:bg-subtle focus:bg-subtle',
        className
      )}
      {...props}
    >
      {Icon && <Icon className={cn('size-4 shrink-0', tone === 'danger' ? '' : 'text-fg-subtle')} />}
      {children}
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="-mx-1.5 my-1.5 h-px bg-line" />;
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 py-2">{children}</div>;
}
