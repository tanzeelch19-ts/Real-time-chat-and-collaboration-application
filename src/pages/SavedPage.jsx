import { useNavigate, useParams } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import { useChannels } from '@/features/channels/useChannels';
import { useConversations } from '@/features/conversations/useConversations';
import { useSavedMessages } from '@/features/pins/usePins';
import { toSerializableError } from '@/services/api/errors';

const TIME = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function pathFor(workspaceId, roomId) {
  const separator = roomId.indexOf(':');
  const kind = roomId.slice(0, separator);
  const id = roomId.slice(separator + 1);
  const base = `/w/${workspaceId}`;
  return kind === 'conversation' ? `${base}/dm/${id}` : `${base}/channels/${id}`;
}

/** Messages you saved. Only you can see this list. */
export default function SavedPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const saved = useSavedMessages();
  const { data: channels = [] } = useChannels(workspaceId);
  const { data: conversations = [] } = useConversations(workspaceId);

  // Show only saved messages from rooms that belong to this workspace.
  const titles = new Map([
    ...channels.map((c) => [`channel:${c.id}`, `#${c.name}`]),
    ...conversations.map((c) => [c.roomId, c.name]),
  ]);
  const items = (saved.data ?? []).filter((m) => titles.has(m.roomId));

  return (
    <div className="mx-auto h-full w-full max-w-3xl space-y-6 overflow-y-auto px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Saved messages</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Only you can see the messages you saved.
        </p>
      </header>

      {saved.isPending && <SkeletonList rows={3} label="Loading saved messages" />}
      {saved.isError && <FormAlert>{toSerializableError(saved.error).message}</FormAlert>}

      {saved.data && items.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="No saved messages"
          description="Use the bookmark icon on any message to save it here."
        />
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((message) => (
            <li key={message.id}>
              <button
                type="button"
                onClick={() => navigate(pathFor(workspaceId, message.roomId))}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/40"
              >
                <div className="flex flex-wrap items-baseline gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{titles.get(message.roomId)}</span>
                  <span>{message.author.displayName}</span>
                  <time dateTime={message.createdAt}>{TIME.format(new Date(message.createdAt))}</time>
                </div>
                <p className="mt-1 line-clamp-2 break-words text-sm">{message.body}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}