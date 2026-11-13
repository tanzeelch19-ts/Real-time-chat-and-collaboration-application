import { cn } from '@/utils/cn';

export function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-slate-200 motion-reduce:animate-none dark:bg-slate-800',
        className,
      )}
    />
  );
}

/**
 * Loading placeholder for lists. Announced to screen readers as a status.
 */
export function SkeletonList({ rows = 3, label = 'Loading' }) {
  return (
    <div role="status" className="space-y-2 p-2">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-7 w-full" />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}