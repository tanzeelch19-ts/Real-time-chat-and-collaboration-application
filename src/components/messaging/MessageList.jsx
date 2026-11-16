import MessageItem from '@/components/messaging/MessageItem';
import { cn } from '@/utils/cn';
import { dayLabel, sameLocalDay } from '@/utils/dates';
import { isGroupedWithPrevious } from '@/utils/grouping';

function Divider({ label, tone = 'slate' }) {
  const line = tone === 'red' ? 'bg-red-300 dark:bg-red-500/40' : 'bg-slate-200 dark:bg-slate-800';
  const text = tone === 'red' ? 'font-semibold text-red-600 dark:text-red-400' : 'font-medium text-slate-500 dark:text-slate-400';
  return (
    <li role="separator" className={cn('flex items-center gap-3 py-2 text-xs', text)}>
      <span className={cn('h-px flex-1', line)} />
      <span>{label}</span>
      <span className={cn('h-px flex-1', line)} />
    </li>
  );
}

/**
 * Message history with date separators, a "New" divider above the first message that arrived
 * after the room was opened, and grouping of consecutive messages from the same person.
 */
export default function MessageList({
  messages,
  currentUserId,
  openedAt,
  emptyText = 'No messages yet. Say hello.',
  ...itemProps
}) {
  if (messages.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>;
  }

  const rows = [];
  let newMarked = false;

  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    const newDay = !previous || !sameLocalDay(previous.createdAt, message.createdAt);
    if (newDay) rows.push(<Divider key={'day-' + message.id} label={dayLabel(message.createdAt)} />);

    const isNew =
      !newMarked &&
      Boolean(openedAt) &&
      message.createdAt > openedAt &&
      message.author.id !== currentUserId &&
      !message.deletedAt;
    if (isNew) {
      newMarked = true;
      rows.push(<Divider key={'new-' + message.id} label="New" tone="red" />);
    }

    const grouped = !newDay && !isNew && isGroupedWithPrevious(previous, message);
    rows.push(
      <MessageItem
        key={message.id}
        message={message}
        currentUserId={currentUserId}
        grouped={grouped}
        {...itemProps}
      />,
    );
  });

  return (
    <ol role="log" aria-live="polite" className="space-y-0.5">
      {rows}
    </ol>
  );
}