import { Skeleton } from '@/components/common/Skeleton';

export default function PageLoader({ label = 'Loading' }) {
  return (
    <div role="status" className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-64 space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
