import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/common/Button';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import MessageComposer from '@/components/messaging/MessageComposer';
import MessageItem from '@/components/messaging/MessageItem';
import MessageList from '@/components/messaging/MessageList';
import { useAuth } from '@/features/auth/useAuth';
import { useSendMessage, useThreadMessages } from '@/features/messages/useMessages';
import { toSerializableError } from '@/services/api/errors';

/**
 * Side panel with one channel message and its replies. On small screens it covers the room.
 */
export default function ThreadPanel({ roomId, parent, canModerate, onClose, onReact, onEdit, onDelete }) {
  const { user } = useAuth();
  const { data, isPending, isError, error } = useThreadMessages(roomId, parent.id);
  const send = useSendMessage(roomId);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const replyCount = data?.messages.length ?? 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [replyCount]);

  const onSubmit = (event) => {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    send(body, parent.id);
    setText('');
  };

  const itemProps = { currentUserId: user?.id, canModerate, onReact, onEdit, onDelete };

  return (
    <aside
      aria-label="Thread"
      className="absolute inset-0 z-10 flex min-h-0 flex-col bg-white dark:bg-slate-900 sm:static sm:inset-auto sm:z-auto sm:w-96 sm:border-l sm:border-slate-200 dark:sm:border-slate-800"
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-semibold">Thread</h2>
        <Button variant="ghost" size="icon" aria-label="Close thread" onClick={onClose}>
          <X size={16} aria-hidden="true" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <ul className="mb-3 border-b border-slate-200 pb-3 dark:border-slate-800">
          <MessageItem message={parent} readOnly {...itemProps} />
        </ul>

        {isPending && <SkeletonList rows={2} label="Loading replies" />}
        {isError && <FormAlert>{toSerializableError(error).message}</FormAlert>}
        {data && <MessageList messages={data.messages} emptyText="No replies yet." {...itemProps} />}
        <div ref={bottomRef} />
      </div>

      <MessageComposer
        value={text}
        onChange={setText}
        onSubmit={onSubmit}
        disabled={false}
        placeholder="Reply in thread"
      />
    </aside>
  );
}