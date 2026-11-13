import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, className, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        className={cn(
          'h-12 w-full rounded-xl border border-line bg-white px-4 text-[15px] text-ink transition placeholder:text-ink-soft/70 hover:border-ink-soft focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none',
          className,
        )}
        {...props}
      />
      {hint && (
        <p id={`${inputId}-hint`} className="text-xs text-ink-soft">
          {hint}
        </p>
      )}
    </div>
  );
});
