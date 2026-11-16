import { cn } from '@/utils/cn';

/**
 * Labelled input with a hint and an error message, wired with aria-describedby
 * and aria-invalid. Accepts the props returned by React Hook Form's register().
 */
export default function FormField({ id, label, error, hint, className, ...inputProps }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={cn(
          'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors dark:bg-slate-950 dark:text-slate-100',
          error
            ? 'border-red-500 focus-visible:outline-red-500 dark:border-red-500'
            : 'border-slate-300 dark:border-slate-700',
          className,
        )}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
