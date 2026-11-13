import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/features/notifications/notificationsApi';
import { connectSocket } from '@/services/socket/socketClient';

export const notificationKeys = {
  all: ['notifications'],
  summary: ['notifications', 'summary'],
  list: ['notifications', 'list'],
};

/** Unread total and per-room counts. Refreshed each minute, and on every socket push. */
export function useNotificationSummary() {
  return useQuery({
    queryKey: notificationKeys.summary,
    queryFn: () => notificationsApi.summary(),
    refetchInterval: 60000,
  });
}

export function useNotificationList(enabled) {
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: () => notificationsApi.list(),
    enabled,
  });
}

/** Refreshes the badge and list the moment the server pushes a notification. */
export function useNotificationSocketSync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const socket = connectSocket();
    const onNew = () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, [queryClient]);
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId) => notificationsApi.markRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useReadAllNotifications(workspaceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.readAll(workspaceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

/** Opening a room marks it read, which also clears its channel unread badge. */
export function useReadRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId) => notificationsApi.readRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}