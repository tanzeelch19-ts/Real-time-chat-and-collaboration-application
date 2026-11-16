import { cn } from '@/utils/cn';

const TONES = {
  error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
  info: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300',
};

export default function FormAlert({ tone = 'error', children, className }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-lg border px-3 py-2 text-sm', TONES[tone], className)}
    >
      {children}
    </div>
  );
}
