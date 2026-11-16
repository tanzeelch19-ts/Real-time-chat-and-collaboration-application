import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import { auditApi } from '@/features/audit/auditApi';
import { toSerializableError } from '@/services/api/errors';

const TIME = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** Recent moderation and membership changes. Message text is never recorded here. */
export default function AuditPanel({ workspaceId }) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['audit', workspaceId],
    queryFn: () => auditApi.list(workspaceId),
  });

  return (
    <section
      aria-labelledby="audit-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 id="audit-heading" className="text-base font-semibold">
        Audit log
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Recent role changes, removals, and invite links. Message text is never recorded here.
      </p>

      <div className="mt-4">
        {isPending && <SkeletonList rows={3} label="Loading audit log" />}
        {isError && <FormAlert>{toSerializableError(error).message}</FormAlert>}
        {data && data.length === 0 && (
          <EmptyState
            icon={ScrollText}
            title="Nothing recorded yet"
            description="Role changes, removals, and invite links appear here."
          />
        )}
        {data && data.length > 0 && (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.map((entry) => (
              <li key={entry.id} className="py-3 text-sm">
                <p>
                  <span className="font-medium">{entry.actor.displayName}</span> {entry.summary}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <code className="font-mono">{entry.action}</code> · {TIME.format(new Date(entry.createdAt))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
