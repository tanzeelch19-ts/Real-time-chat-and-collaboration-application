import { Pin, X } from 'lucide-react';
import Button from '@/components/common/Button';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import { usePinnedMessages } from '@/features/pins/usePins';
import { toSerializableError } from '@/services/api/errors';

/** Pinned messages of one room, shown above the message list. */
export default function PinnedPanel({ roomId, onClose }) {
  const { data, isPending, isError, error } = usePinnedMessages(roomId);

  return (
    <section
      aria-label="Pinned messages"
      className="max-h-72 shrink-0 overflow-y-auto border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/60"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Pin size={14} aria-hidden="true" />
          Pinned messages
        </h2>
        <Button variant="ghost" size="icon" aria-label="Close pinned messages" onClick={onClose}>
          <X size={16} aria-hidden="true" />
        </Button>
      </div>

      {isPending && <SkeletonList rows={2} label="Loading pinned messages" />}
      {isError && <FormAlert>{toSerializableError(error).message}</FormAlert>}
      {data && data.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Nothing is pinned here yet.</p>
      )}
      {data && data.length > 0 && (
        <ul className="space-y-2">
          {data.map((message) => (
            <li key={message.id} className="rounded-lg bg-white p-2 text-sm dark:bg-slate-950">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{message.author.displayName}</p>
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}