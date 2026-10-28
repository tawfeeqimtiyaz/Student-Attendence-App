// ============================================
// Dialog — built on the native <dialog> element:
// top-layer rendering (never hidden behind the shell), inert background,
// focus containment and Escape handling come from the platform.
// ============================================

import React, { useId, useLayoutEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button, IconButton } from './Button';

type Variant = 'center' | 'sheet' | 'drawer-left';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** center: modal · sheet: right-side panel (forms) · drawer-left: navigation */
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  /** Prevent closing (Escape / backdrop) while work is in progress. */
  dismissible?: boolean;
  /** Render children only (custom layout). The title stays as a visually hidden heading. */
  bare?: boolean;
  className?: string;
  bodyClassName?: string;
}

const panelVariant: Record<Variant, string> = {
  center: 'm-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] rounded-2xl animate-pop-in',
  sheet: 'ml-auto mr-0 my-0 h-dvh max-h-dvh w-full rounded-none sm:rounded-l-2xl animate-slide-in-right',
  'drawer-left': 'ml-0 mr-auto my-0 h-dvh max-h-dvh w-[min(300px,calc(100vw-3rem))] rounded-none animate-slide-in-left',
};

const panelSize = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg' };

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'center',
  size = 'md',
  dismissible = true,
  bare = false,
  className,
  bodyClassName,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const previouslyFocused = document.activeElement as HTMLElement | null;
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.documentElement.style.overflow = '';
        if (dialog.open) dialog.close();
        previouslyFocused?.focus?.();
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        // Escape key: let React state decide.
        e.preventDefault();
        if (dismissible) onCloseRef.current();
      }}
      onClick={(e) => {
        // Clicks on the ::backdrop target the <dialog> element itself.
        if (e.target === e.currentTarget && dismissible) onCloseRef.current();
      }}
      className={cn(
        'hidden flex-col overflow-hidden border border-line open:flex bg-card text-fg shadow-lg backdrop:bg-overlay',
        panelVariant[variant],
        variant !== 'drawer-left' && panelSize[size],
        className
      )}
    >
      {bare ? (
        <>
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
          {children}
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4 px-5 pt-5">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold text-fg">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-[13px] text-fg-muted">
                  {description}
                </p>
              )}
            </div>
            <IconButton label="Close" icon={<X />} size="sm" className="-mr-1.5 -mt-1" onClick={onClose} disabled={!dismissible} />
          </div>
          <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-5', bodyClassName)}>{children}</div>
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-line bg-subtle/60 px-5 py-3.5 sm:flex-row sm:justify-end">
              {footer}
            </div>
          )}
        </>
      )}
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
}

/** Confirmation for destructive or sensitive actions. Explains what will happen. */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      dismissible={!loading}
      bodyClassName="pt-2 text-sm text-fg-muted"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} autoFocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
