import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { conversationKeys } from '@/features/conversations/useConversations';
import { mergeIncomingMessage, replaceMessage } from '@/features/messages/messagesCache';
import { messageKeys } from '@/features/messages/useMessages';
import { presenceChanged, presenceSnapshot } from '@/features/presence/presenceSlice';
import { connectSocket, disconnectSocket } from '@/services/socket/socketClient';

/**
 * Keeps the React Query caches and presence in step with server events.
 * Mounted once in the app shell, so it runs on every signed-in page.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      dispatch(presenceSnapshot({ userIds: [], awayIds: [] }));
      return undefined;
    }

    const socket = connectSocket();

    const onNewMessage = (message) => {
      const key = message.threadId
        ? messageKeys.thread(message.roomId, message.threadId)
        : messageKeys.room(message.roomId);
      queryClient.setQueryData(key, (data) => mergeIncomingMessage(data, message));
      if (!message.threadId) queryClient.invalidateQueries({ queryKey: ['channels'] });
      if (!message.threadId) queryClient.invalidateQueries({ queryKey: ['channels'] });
    };

    const onUpdatedMessage = (message) => {
      queryClient.setQueryData(messageKeys.room(message.roomId), (data) => replaceMessage(data, message));
      if (message.threadId) {
        queryClient.setQueryData(messageKeys.thread(message.roomId, message.threadId), (data) =>
          replaceMessage(data, message),
        );
      }
    };

    const onConversationCreated = () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    };
    const onSnapshot = ({ userIds = [], awayIds = [] }) => dispatch(presenceSnapshot({ userIds, awayIds }));
    const onPresence = (payload) => dispatch(presenceChanged(payload));

    socket.on('message:new', onNewMessage);
    socket.on('message:updated', onUpdatedMessage);
    socket.on('conversation:created', onConversationCreated);
    socket.on('presence:snapshot', onSnapshot);
    socket.on('presence:update', onPresence);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('message:updated', onUpdatedMessage);
      socket.off('conversation:created', onConversationCreated);
      socket.off('presence:snapshot', onSnapshot);
      socket.off('presence:update', onPresence);
    };
  }, [isAuthenticated, queryClient, dispatch]);

  // Tells the server this user is active, so it can show "away" after a quiet spell.
  // Sent at most once a minute.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let last = 0;
    const ping = () => {
      const now = Date.now();
      if (now - last < 60000) return;
      last = now;
      connectSocket().emit('presence:activity');
    };
    const events = ['pointerdown', 'keydown', 'pointermove', 'scroll'];
    events.forEach((name) => window.addEventListener(name, ping, { passive: true }));
    return () => events.forEach((name) => window.removeEventListener(name, ping));
  }, [isAuthenticated]);
}
