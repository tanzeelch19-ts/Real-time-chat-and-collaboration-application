import { useState } from 'react';
import { Bookmark, MessageSquare, Pencil, Pin, Smile, Trash2 } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import EmojiPicker from '@/components/common/EmojiPicker';
import AttachmentPreview from '@/components/messaging/AttachmentPreview';
import MentionText from '@/components/messaging/MentionText';
import { cn } from '@/utils/cn';

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

/**
 * One message. Actions appear on hover or keyboard focus. Grouped messages hide the header
 * and show the time in the gutter on hover. Deleting asks for confirmation first.
 */
export default function MessageItem({
  message,
  currentUserId,
  canModerate = false,
  readOnly = false,
  grouped = false,
  mentionNames = [],
  pinnedIds = [],
  savedIds = [],
  onOpenThread,
  onReact,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleSave,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const isMine = message.author.id === currentUserId;
  const deleted = Boolean(message.deletedAt);
  const pending = message.status === 'sending';
  const failed = message.status === 'failed';
  const busy = pending || failed;
  const isPinned = pinnedIds.includes(message.id);
  const isSaved = savedIds.includes(message.id);
  const time = TIME_FORMAT.format(new Date(message.createdAt));

  const canReact = !deleted && !busy;
  const canReply = !readOnly && !message.threadId && !deleted && !busy;
  const canEdit = !readOnly && isMine && !deleted && !busy;
  const canDelete = !readOnly && (isMine || canModerate) && !deleted && !busy;
  const canPin = Boolean(onTogglePin) && !deleted && !busy;
  const canSave = Boolean(onToggleSave) && !deleted && !busy;
  const showToolbar = !editing && (canReact || canReply || canEdit || canDelete || canPin || canSave);
  const showStatusRow = !grouped || pending || failed || isPinned || (message.editedAt && !deleted);

  const runAction = async (action, fallback) => {
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err?.message ?? fallback);
    }
  };

  const startEditing = () => {
    setDraft(message.body);
    setActionError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(message.body);
    setActionError(null);
  };

  const saveEdit = async () => {
    const body = draft.trim();
    if (!body) {
      setActionError('Message cannot be empty.');
      return;
    }
    if (body === message.body) {
      setEditing(false);
      return;
    }
    try {
      await onEdit(message.id, body);
      setEditing(false);
    } catch (err) {
      setActionError(err?.message ?? 'Could not save your changes.');
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setActionError(null);
    try {
      await onDelete(message.id);
    } catch (err) {
      setActionError(err?.message ?? 'Could not delete this message.');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const react = (emoji) => {
    setPickerOpen(false);
    runAction(() => onReact(message.id, emoji), 'Could not add the reaction.');
  };

  const togglePin = () => runAction(() => onTogglePin(message.id), 'Could not change the pin.');
  const toggleSave = () => runAction(() => onToggleSave(message.id), 'Could not change the save.');

  return (
    <li
      data-message-id={message.id}
      className={cn(
        'group relative flex gap-3 rounded-lg px-2 hover:bg-slate-100/60 focus-within:bg-slate-100/60 dark:hover:bg-slate-800/40 dark:focus-within:bg-slate-800/40',
        grouped ? 'py-0.5' : 'py-2',
      )}
    >
      {grouped ? (
        <div className="flex w-9 shrink-0 justify-center pt-1">
          <time
            dateTime={message.createdAt}
            className="hidden text-[10px] text-slate-400 group-focus-within:block group-hover:block"
          >
            {time}
          </time>
        </div>
      ) : (
        <Avatar name={message.author.displayName} src={message.author.avatarUrl} size="md" />
      )}

      <div className="min-w-0 flex-1">
        {showStatusRow && (
          <div className="flex flex-wrap items-baseline gap-2">
            {!grouped && (
              <>
                <span className="text-sm font-semibold">{message.author.displayName}</span>
                <time dateTime={message.createdAt} className="text-xs text-slate-500 dark:text-slate-400">
                  {time}
                </time>
              </>
            )}
            {message.editedAt && !deleted && <span className="text-xs text-slate-400">(edited)</span>}
            {isPinned && !deleted && (
              <span className="text-xs font-medium text-brand-600 dark:text-brand-300">Pinned</span>
            )}
            {pending && <span className="text-xs text-slate-400">Sending...</span>}
            {failed && <span className="text-xs font-medium text-red-600">Not sent</span>}
          </div>
        )}

        {editing ? (
          <div className="mt-1 space-y-2">
            <textarea
              aria-label="Edit message"
              rows={2}
              maxLength={4000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') cancelEditing();
              }}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white p-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
            />
            <div className="flex gap-2">
              <Button className="h-8 px-3" onClick={saveEdit}>
                Save
              </Button>
              <Button variant="secondary" className="h-8 px-3" onClick={cancelEditing}>
                Cancel
              </Button>
            </div>
          </div>
        ) : deleted ? (
          <p className="text-sm italic text-slate-500 dark:text-slate-400">This message was deleted.</p>
        ) : (
          <p
            className={cn(
              'whitespace-pre-wrap break-words text-sm',
              failed && 'text-red-600 dark:text-red-400',
            )}
          >
            <MentionText text={message.body} names={mentionNames} />
          </p>
        )}

        {!deleted &&
          message.attachments?.map((attachment) => (
            <AttachmentPreview key={attachment.id} attachment={attachment} />
          ))}

        {!deleted && message.reactions?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.reactions.map((reaction) => {
              const mine = reaction.userIds.includes(currentUserId);
              return (
                <button
                  key={reaction.emoji}
                  type="button"
                  aria-pressed={mine}
                  aria-label={`${reaction.emoji} ${reaction.count}${mine ? ', you reacted' : ''}`}
                  onClick={() => react(reaction.emoji)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                    mine
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                      : 'border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800',
                  )}
                >
                  <span aria-hidden="true">{reaction.emoji}</span>
                  <span aria-hidden="true">{reaction.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {!readOnly && !deleted && message.replyCount > 0 && (
          <button
            type="button"
            onClick={() => onOpenThread?.(message)}
            className="mt-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
          >
            {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {pickerOpen && (
          <div className="mt-2">
            <EmojiPicker onPick={react} />
          </div>
        )}

        {actionError && (
          <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {actionError}
          </p>
        )}
      </div>

      {showToolbar && (
        <div className="absolute right-2 top-1 hidden items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm group-focus-within:flex group-hover:flex dark:border-slate-700 dark:bg-slate-900">
          {canReact && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Add reaction"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((open) => !open)}
            >
              <Smile size={14} aria-hidden="true" />
            </Button>
          )}
          {canPin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={isPinned ? 'Unpin message' : 'Pin message'}
              aria-pressed={isPinned}
              onClick={togglePin}
            >
              <Pin size={14} aria-hidden="true" />
            </Button>
          )}
          {canSave && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={isSaved ? 'Remove from saved' : 'Save message'}
              aria-pressed={isSaved}
              onClick={toggleSave}
            >
              <Bookmark size={14} aria-hidden="true" />
            </Button>
          )}
          {canReply && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Reply in thread"
              onClick={() => onOpenThread?.(message)}
            >
              <MessageSquare size={14} aria-hidden="true" />
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Edit this message"
              onClick={startEditing}
            >
              <Pencil size={14} aria-hidden="true" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Delete this message"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 size={14} aria-hidden="true" />
            </Button>
          )}
        </div>
      )}

      {canDelete && (
        <ConfirmationDialog
          open={confirmOpen}
          title="Delete this message?"
          description="Everyone in this conversation will see that it was deleted. This cannot be undone."
          confirmLabel="Delete"
          danger
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </li>
  );
}