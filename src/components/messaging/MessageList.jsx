import MessageItem from '@/components/messaging/MessageItem';
import { isGroupedWithPrevious } from '@/utils/grouping';

/**
 * Renders messages. A message from the same person as the one before it is grouped,
 * so it drops the name and avatar. Extra props go to every item.
 */
export default function MessageList({ messages, emptyText = 'No messages yet. Say hello.', ...itemProps }) {
  if (messages.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>;
  }

  return (
    <ol role="log" aria-live="polite" className="space-y-0.5">
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          grouped={isGroupedWithPrevious(messages[index - 1], message)}
          {...itemProps}
        />
      ))}
    </ol>
  );
}