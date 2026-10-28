// ============================================
// Tooltip — rendered in a portal with fixed positioning so it is never
// clipped by scroll containers (e.g. the collapsed sidebar).
// Shows on hover and keyboard focus. Supplementary only: the trigger
// must already have an accessible name.
// ============================================

import React, { cloneElement, useId, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactElement<Pick<React.HTMLAttributes<HTMLElement>, 'onMouseEnter' | 'onMouseLeave' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'aria-describedby'>>;
  side?: 'right' | 'bottom';
  disabled?: boolean;
}

export function Tooltip({ content, children, side = 'right', disabled = false }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const id = useId();

  if (disabled) return children;

  const show = (e: React.SyntheticEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos(side === 'right' ? { x: rect.right + 8, y: rect.top + rect.height / 2 } : { x: rect.left + rect.width / 2, y: rect.bottom + 8 });
  };
  const hide = () => setPos(null);

  const child = children.props;
  return (
    <>
      {cloneElement(children, {
        'aria-describedby': pos ? id : undefined,
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          child.onMouseEnter?.(e);
          show(e);
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          child.onMouseLeave?.(e);
          hide();
        },
        onFocus: (e: React.FocusEvent<HTMLElement>) => {
          child.onFocus?.(e);
          if (e.currentTarget.matches(':focus-visible')) show(e);
        },
        onBlur: (e: React.FocusEvent<HTMLElement>) => {
          child.onBlur?.(e);
          hide();
        },
        onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
          child.onKeyDown?.(e);
          if (e.key === 'Escape') hide();
        },
      })}
      {pos &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            style={{ left: pos.x, top: pos.y }}
            className={
              'pointer-events-none fixed z-[70] whitespace-nowrap rounded-md bg-fg px-2 py-1 text-xs font-medium text-canvas shadow-md animate-fade-in ' +
              (side === 'right' ? '-translate-y-1/2' : '-translate-x-1/2')
            }
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
