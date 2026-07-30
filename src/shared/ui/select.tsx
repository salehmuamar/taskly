import { type SelectHTMLAttributes, forwardRef, useId } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, id: propId, children, ...props }, ref) => {
    const generatedId = useId();
    const id = propId || generatedId;
    const errorId = `${id}-error`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-semibold text-slate-600 dark:text-slate-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`block w-full px-3 py-2.5 glass rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 sm:text-sm transition-all duration-200 ${error ? 'border-red-500/50 focus:ring-red-500/50' : ''} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p id={errorId} className="text-sm text-red-500 dark:text-red-400" role="alert">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
