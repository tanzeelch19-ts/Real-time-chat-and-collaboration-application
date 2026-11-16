import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import {
  addPendingMessage,
  confirmPendingMessage,
  markPendingFailed,
  prependOlder,
  replaceMessage,
} from '@/features/messages/messagesCache';
import { messagesApi } from '@/features/messages/messagesApi';
import { connectSocket } from '@/services/socket/socketClient';

export const messageKeys = {
  room: (roomId) => ['messages', roomId],
  thread: (roomId, threadId) => ['messages', roomId, 'thread', threadId],
};

/** Writes a server copy of a message into every cache that may show it. */
export function applyServerMessage(queryClient, message) {
  queryClient.setQueryData(messageKeys.room(message.roomId), (data) => replaceMessage(data, message));
  if (message.threadId) {
    queryClient.setQueryData(messageKeys.thread(message.roomId, message.threadId), (data) =>
      replaceMessage(data, message),
    );
  }
}

export function useRoomMessages(roomId) {
  return useQuery({
    queryKey: messageKeys.room(roomId),
    queryFn: () => messagesApi.list(roomId),
    enabled: Boolean(roomId),
  });
}

export function useThreadMessages(roomId, threadId) {
  return useQuery({
    queryKey: messageKeys.thread(roomId, threadId),
    queryFn: () => messagesApi.listThread(roomId, threadId),
    enabled: Boolean(roomId && threadId),
  });
}

export function useLoadOlderMessages(roomId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (before) => messagesApi.list(roomId, { before }),
    onSuccess: (page) =>
      queryClient.setQueryData(messageKeys.room(roomId), (data) => prependOlder(data, page)),
  });
}

/**
 * Returns send(body, threadId?). The message appears at once as "sending".
 * It goes through the socket when connected, and through REST otherwise.
 */
export function useSendMessage(roomId) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return (body, threadId = null) => {
    const key = threadId ? messageKeys.thread(roomId, threadId) : messageKeys.room(roomId);
    const clientId = crypto.randomUUID();
    const pending = {
      id: `pending-${clientId}`,
      clientId,
      roomId,
      threadId,
      body,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
      author: {
        id: user?.id,
        displayName: user?.displayName ?? '',
        avatarUrl: user?.avatarUrl ?? '',
      },
      replyCount: 0,
      reactions: [],
      status: 'sending',
    };
    queryClient.setQueryData(key, (data) => addPendingMessage(data, pending));

    const onSaved = (message) =>
      queryClient.setQueryData(key, (data) => confirmPendingMessage(data, clientId, message));
    const onFailed = () => queryClient.setQueryData(key, (data) => markPendingFailed(data, clientId));

    const socket = connectSocket();
    if (socket.connected) {
      socket.timeout(8000).emit('message:send', { roomId, body, threadId, clientId }, (error, response) => {
        if (error || !response?.ok) return onFailed();
        return onSaved(response.message);
      });
    } else {
      messagesApi.send(roomId, body, threadId).then(onSaved).catch(onFailed);
    }
    return clientId;
  };
}

export function useEditMessage(roomId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, body }) => messagesApi.edit(roomId, messageId, body),
    onSuccess: (message) => applyServerMessage(queryClient, message),
  });
}

export function useDeleteMessage(roomId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId) => messagesApi.remove(roomId, messageId),
    onSuccess: (message) => applyServerMessage(queryClient, message),
  });
}

export function useToggleReaction(roomId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }) => messagesApi.toggleReaction(roomId, messageId, emoji),
    onSuccess: (message) => applyServerMessage(queryClient, message),
  });
}
