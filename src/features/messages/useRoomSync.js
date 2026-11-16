import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/features/messages/messagesApi';
import { mergeIncomingMessage, replaceMessage } from '@/features/messages/messagesCache';
import { messageKeys } from '@/features/messages/useMessages';

const INTERVAL_MS = 4000;

/**
 * Keeps the open room up to date even if a live event is missed. Fetches the newest page
 * every few seconds and when the tab regains focus, then merges it by message id so nothing
 * is shown twice.
 */
export function useRoomSync(roomId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return undefined;
    let cancelled = false;
    const key = messageKeys.room(roomId);

    const sync = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const page = await messagesApi.list(roomId);
        if (cancelled) return;
        queryClient.setQueryData(key, (data) => {
          if (!data) return page;
          let next = data;
          for (const message of page.messages) {
            next = next.messages.some((m) => m.id === message.id)
              ? replaceMessage(next, message)
              : mergeIncomingMessage(next, message);
          }
          return next;
        });
      } catch {
        // Network hiccup: the next tick tries again.
      }
    };

    const timer = setInterval(sync, INTERVAL_MS);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, [roomId, queryClient]);
}
