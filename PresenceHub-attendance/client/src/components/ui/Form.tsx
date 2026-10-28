// ============================================
// Form controls — FormField wires label, hint and error to its control
// (id / aria-describedby / aria-invalid) through context.
// ============================================

import React, { createContext, useContext, useId } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FieldContextValue {
  id: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

interface FormFieldProps {
  label: React.ReactNode;
  children: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  /** Visually hide the label (still read by screen readers). */
  hideLabel?: boolean;
  className?: string;
  /** Optional element aligned to the right of the label (e.g. a link). */
  labelAside?: React.ReactNode;
}

export function FormField({ label, children, hint, error, required = false, hideLabel, className, labelAside }: FormFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error), required }}>
      <div className={cn('flex flex-col gap-1.5', className)}>
        <div className={cn('flex items-center justify-between gap-2', hideLabel && 'sr-only')}>
          <label htmlFor={id} className="text-[13px] font-medium text-fg">
            {label}
            {required && (
              <span className="ml-0.5 text-danger-text" aria-hidden>
                *
              </span>
            )}
          </label>
          {labelAside}
        </div>
        {children}
        {error ? (
          <p id={errorId} className="text-xs font-medium text-danger-text" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-xs text-fg-subtle">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

function useFieldProps<P extends { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: unknown; required?: boolean }>(props: P) {
  const field = useContext(FieldContext);
  if (!field) return props;
  return {
    ...props,
    id: props.id ?? field.id,
    'aria-describedby': props['aria-describedby'] ?? field.describedBy,
    'aria-invalid': props['aria-invalid'] ?? (field.invalid || undefined),
    required: props.required ?? (field.required || undefined),
  };
}

export const controlClasses =
  'w-full rounded-md border border-line bg-card text-sm text-fg shadow-xs ' +
  'placeholder:text-fg-subtle transition-[border-color,box-shadow] duration-150 ' +
  'hover:border-line-strong focus:outline-none focus:border-brand focus:ring-3 focus:ring-brand-ring ' +
  'disabled:cursor-not-allowed disabled:bg-subtle disabled:text-fg-subtle ' +
  'aria-invalid:border-danger aria-invalid:focus:ring-danger/25';

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  const fieldProps = useFieldProps(props);
  return <input className={cn(controlClasses, 'h-9 px-3', className)} {...fieldProps} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  const fieldProps = useFieldProps(props);
  return <textarea className={cn(controlClasses, 'min-h-24 px-3 py-2 leading-relaxed', className)} {...fieldProps} />;
}

export function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  const fieldProps = useFieldProps(props);
  return (
    <div className={cn('relative', className)}>
      <select className={cn(controlClasses, 'h-9 appearance-none truncate pl-3 pr-9')} {...fieldProps}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
    </div>
  );
}

interface SearchInputProps extends Omit<React.ComponentProps<'input'>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  /** Accessible label (also used as placeholder if none given). */
  label: string;
}

export function SearchInput({ value, onChange, label, placeholder, className, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder ?? label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(controlClasses, 'h-9 pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden')}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-fg-subtle hover:bg-subtle hover:text-fg"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/** Groups related fields in long forms. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <div>
        <legend className="text-sm font-semibold text-fg">{title}</legend>
        {description && <p className="mt-0.5 text-xs text-fg-subtle">{description}</p>}
      </div>
      {children}
    </fieldset>
  );
}
