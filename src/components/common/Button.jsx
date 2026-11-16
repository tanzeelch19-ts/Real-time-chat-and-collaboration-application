import { cn } from '@/utils/cn';

const variants = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
  secondary:
    'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
};

const sizes = {
  md: 'h-9 px-3.5 text-sm',
  icon: 'h-9 w-9',
};

/**
 * Base button. Defaults to type="button" so it never submits a form by accident.
 */
export default function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
