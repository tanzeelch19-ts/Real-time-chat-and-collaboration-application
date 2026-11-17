import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { Pin, RotateCw, Video } from 'lucide-react';
import Button from '@/components/common/Button';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import MessageComposer from '@/components/messaging/MessageComposer';
import MessageList from '@/components/messaging/MessageList';
import { useAuth } from '@/features/auth/useAuth';
import { useUploadAttachment } from '@/features/files/useAttachments';
import MeetingPanel from '@/features/meetings/components/MeetingPanel';
import { useRoomMeetings } from '@/features/meetings/useMeetings';
import PinnedPanel from '@/features/pins/components/PinnedPanel';
import { usePinnedMessages, useSavedMessages, useToggleSave, useTogglePin } from '@/features/pins/usePins';
import ThreadPanel from '@/features/messages/components/ThreadPanel';
import { clearDraft, selectDraft, setDraft } from '@/features/messages/draftsSlice';
import { useTypingIndicator } from '@/features/messages/useTypingIndicator';
import { useRoomSync } from '@/features/messages/useRoomSync';
import {
  useDeleteMessage,
  useEditMessage,
  useLoadOlderMessages,
  useRoomMessages,
  useSendMessage,
  useToggleReaction,
} from '@/features/messages/useMessages';
import { useReadRoom } from '@/features/notifications/useNotifications';
import { useMembers } from '@/features/workspaces/useWorkspaces';
import { toSerializableError } from '@/services/api/errors';
import { connectSocket } from '@/services/socket/socketClient';

function typingText(typers) {
  if (typers.length === 0) return '';
  if (typers.length === 1) return `${typers[0].displayName} is typing...`;
  if (typers.length === 2) return `${typers[0].displayName} and ${typers[1].displayName} are typing...`;
  return 'Several people are typing...';
}

/**
 * Shared screen for channels and direct messages. Keeps the draft in Redux, shows upload
 * progress and retry, and scrolls to a message when the URL has ?message=<id> (from search).
 */
export default function RoomView({
  roomId,
  title,
  subtitle,
  canModerate = false,
  readOnly = false,
  headerActions = null,
}) {
  const dispatch = useDispatch();
  const { workspaceId } = useParams();
  const [params] = useSearchParams();
  const targetId = params.get('message');
  const { user } = useAuth();
  const { data, isPending, isError, error } = useRoomMessages(roomId);
  const { data: members = [] } = useMembers(workspaceId);
  const loadOlder = useLoadOlderMessages(roomId);
  const loadMore = loadOlder.mutate;
  const loadingOlder = loadOlder.isPending;
  const send = useSendMessage(roomId);
  const editMessage = useEditMessage(roomId);
  const deleteMessage = useDeleteMessage(roomId);
  const toggleReaction = useToggleReaction(roomId);
  const upload = useUploadAttachment(roomId);
  const markRead = useReadRoom();
  const pinned = usePinnedMessages(roomId);
  const saved = useSavedMessages();
  const togglePin = useTogglePin(roomId);
  const toggleSave = useToggleSave(roomId);
  const meetings = useRoomMeetings(roomId);
  const { typers, notifyTyping, stopTyping } = useTypingIndicator(roomId);
  useRoomSync(roomId);

  const draftSelector = useMemo(() => selectDraft(roomId), [roomId]);
  const text = useSelector(draftSelector);
  const updateText = (value) => dispatch(setDraft({ roomId, text: value }));

  const [threadParentId, setThreadParentId] = useState(null);
  const [showPinned, setShowPinned] = useState(false);
  const [showMeetings, setShowMeetings] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [failedUpload, setFailedUpload] = useState(null);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const nearBottomRef = useRef(true);
  const [showNew, setShowNew] = useState(false);
  const [openedAt] = useState(() => new Date().toISOString());
  const memberNameMap = Object.fromEntries(members.map((m) => [m.userId, m.displayName]));
  const jumpToBottom = () => {
    nearBottomRef.current = true;
    setShowNew(false);
    bottomRef.current?.scrollIntoView({ block: 'end' });
  };
  const onScrollList = (event) => {
    const el = event.currentTarget;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    nearBottomRef.current = near;
    if (near) setShowNew(false);
  };
  const handledTarget = useRef(null);
  const attemptedCursor = useRef(null);

  const messageCount = data?.messages.length ?? 0;
  const loaded = Boolean(data);
  const markReadMutate = markRead.mutate;
  const mentionNames = members.map((m) => m.displayName);
  const pinnedIds = (pinned.data ?? []).map((m) => m.id);
  const savedIds = (saved.data ?? []).map((m) => m.id);
  const pinnedCount = pinnedIds.length;
  const meetingCount = meetings.data?.length ?? 0;

  // Subscribe to this room's live events. Re-join after every reconnect.
  useEffect(() => {
    const socket = connectSocket();
    const join = () => socket.emit('room:join', roomId);
    join();
    socket.on('connect', join);
    return () => {
      socket.off('connect', join);
      socket.emit('room:leave', roomId);
    };
  }, [roomId]);

  // Search result: load older pages until the message is on screen, then scroll to it once.
  useEffect(() => {
    if (!targetId || !data || handledTarget.current === targetId) return;
    const element = document.querySelector(`[data-message-id="${CSS.escape(targetId)}"]`);
    if (!element) {
      if (data.nextCursor && attemptedCursor.current !== data.nextCursor && !loadingOlder) {
        attemptedCursor.current = data.nextCursor;
        loadMore(data.nextCursor);
      }
      return;
    }
    handledTarget.current = targetId;
    element.scrollIntoView({ block: 'center' });
    element.classList.add('ring-2', 'ring-brand-500', 'rounded-lg');
    setTimeout(() => element.classList.remove('ring-2', 'ring-brand-500', 'rounded-lg'), 2500);
  }, [targetId, data, loadMore, loadingOlder]);

  // Scroll to the newest message, unless a search target is still being found.
  useEffect(() => {
    if (targetId && handledTarget.current !== targetId) return;
    if (nearBottomRef.current) bottomRef.current?.scrollIntoView({ block: 'end' });
    else setShowNew(true);
  }, [messageCount, targetId]);

  // Opening the room, or seeing new messages in it, clears its notifications.
  useEffect(() => {
    if (loaded) markReadMutate(roomId);
  }, [roomId, loaded, messageCount, markReadMutate]);

  // Read the parent from the cache, so reply counts and edits stay current.
  const threadParent = data?.messages.find((m) => m.id === threadParentId) ?? null;

  const onChangeText = (value) => {
    updateText(value);
    if (value.trim()) notifyTyping();
    else stopTyping();
  };

  const onSend = (event) => {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    send(body);
    dispatch(clearDraft(roomId));
    nearBottomRef.current = true;
    setShowNew(false);
    stopTyping();
  };

  const sendUpload = (file, caption) => {
    setFailedUpload(null);
    setUploadProgress(0);
    upload.mutate(
      { file, caption, onProgress: setUploadProgress },
      {
        onSuccess: () => {
          setUploadProgress(null);
          updateText('');
        },
        onError: () => {
          setUploadProgress(null);
          setFailedUpload({ file, caption });
        },
      },
    );
  };

  const onAttach = (file) => sendUpload(file, text.trim());
  const retryUpload = () => {
    if (failedUpload) sendUpload(failedUpload.file, failedUpload.caption);
  };

  const onEdit = (messageId, body) => editMessage.mutateAsync({ messageId, body });
  const onDelete = (messageId) => deleteMessage.mutateAsync(messageId);
  const onReact = (messageId, emoji) => toggleReaction.mutateAsync({ messageId, emoji });
  const onTogglePin = (messageId) => togglePin.mutateAsync(messageId);
  const onToggleSave = (messageId) => toggleSave.mutateAsync(messageId);

  return (
    <div className="relative flex h-full min-h-0 w-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {headerActions}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              className="h-8 px-3"
              aria-pressed={showPinned}
              onClick={() => setShowPinned((value) => !value)}
            >
              <Pin size={14} aria-hidden="true" />
              Pinned{pinnedCount > 0 ? ` (${pinnedCount})` : ''}
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-3"
              aria-pressed={showMeetings}
              onClick={() => setShowMeetings((value) => !value)}
            >
              <Video size={14} aria-hidden="true" />
              Meetings{meetingCount > 0 ? ` (${meetingCount})` : ''}
            </Button>
          </div>
        </header>

        {showPinned && <PinnedPanel roomId={roomId} onClose={() => setShowPinned(false)} />}
        {showMeetings && (
          <MeetingPanel
            roomId={roomId}
            currentUserId={user?.id}
            canModerate={canModerate}
            onClose={() => setShowMeetings(false)}
          />
        )}

        <div
          ref={scrollRef}
          onScroll={onScrollList}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
        >
          {isPending && <SkeletonList rows={4} label="Loading messages" />}
          {isError && <FormAlert>{toSerializableError(error).message}</FormAlert>}

          {data && (
            <>
              {data.nextCursor && (
                <div className="mb-4 flex justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => loadMore(data.nextCursor)}
                    disabled={loadingOlder}
                  >
                    {loadingOlder ? 'Loading...' : 'Load earlier messages'}
                  </Button>
                </div>
              )}
              <MessageList
                messages={data.messages}
                openedAt={openedAt}
                memberNames={memberNameMap}
                currentUserId={user?.id}
                canModerate={canModerate}
                mentionNames={mentionNames}
                pinnedIds={pinnedIds}
                savedIds={savedIds}
                onOpenThread={(message) => setThreadParentId(message.id)}
                onReact={onReact}
                onEdit={onEdit}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
                onToggleSave={onToggleSave}
              />
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {showNew && (
          <div className="flex justify-center px-4 pb-2 sm:px-6">
            <Button className="h-8 px-3" onClick={jumpToBottom}>
              New messages
            </Button>
          </div>
        )}
        <p
          aria-live="polite"
          className="h-5 shrink-0 px-4 text-xs text-slate-500 dark:text-slate-400 sm:px-6"
        >
          {typingText(typers)}
        </p>

        {failedUpload && (
          <div className="mx-4 mb-2 flex flex-wrap items-center gap-2 sm:mx-6">
            <FormAlert className="flex-1">{upload.error?.message ?? 'Upload failed.'}</FormAlert>
            <Button
              variant="secondary"
              className="h-8 px-3"
              onClick={retryUpload}
              disabled={upload.isPending}
            >
              <RotateCw size={14} aria-hidden="true" />
              Retry upload
            </Button>
          </div>
        )}

        <MessageComposer
          value={text}
          onChange={onChangeText}
          onSubmit={onSend}
          disabled={!data || readOnly}
          placeholder={`Message ${title}`}
          members={members}
          onAttach={onAttach}
          uploading={upload.isPending}
          uploadProgress={uploadProgress}
        />
      </div>

      {threadParent && (
        <ThreadPanel
          key={threadParent.id}
          roomId={roomId}
          parent={threadParent}
          canModerate={canModerate}
          onClose={() => setThreadParentId(null)}
          onReact={onReact}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
