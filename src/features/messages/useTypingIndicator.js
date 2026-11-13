import { useCallback, useEffect, useRef, useState } from 'react';
import { connectSocket } from '@/services/socket/socketClient';

const SHOW_FOR_MS = 4000;
const SEND_EVERY_MS = 2000;

/**
 * Tracks who else is typing in a room. Someone's typing shows for a few seconds
 * after their last "typing:start". Sending is throttled, so each keystroke is not a network call.
 */
export function useTypingIndicator(roomId) {
  const [typers, setTypers] = useState([]);
  const timers = useRef(new Map());
  const lastSent = useRef(0);

  useEffect(() => {
    const socket = connectSocket();
    const timerMap = timers.current;

    const forget = (userId) => {
      clearTimeout(timerMap.get(userId));
      timerMap.delete(userId);
      setTypers((current) => current.filter((t) => t.userId !== userId));
    };

    const onTyping = ({ roomId: incomingRoom, userId, displayName, typing }) => {
      if (incomingRoom !== roomId) return;
      if (!typing) {
        forget(userId);
        return;
      }
      clearTimeout(timerMap.get(userId));
      timerMap.set(userId, setTimeout(() => forget(userId), SHOW_FOR_MS));
      setTypers((current) =>
        current.some((t) => t.userId === userId) ? current : [...current, { userId, displayName }],
      );
    };

    socket.on('typing:update', onTyping);
    return () => {
      socket.off('typing:update', onTyping);
      timerMap.forEach((timer) => clearTimeout(timer));
      timerMap.clear();
      setTypers([]);
    };
  }, [roomId]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSent.current < SEND_EVERY_MS) return;
    lastSent.current = now;
    connectSocket().emit('typing:start', roomId);
  }, [roomId]);

  const stopTyping = useCallback(() => {
    lastSent.current = 0;
    connectSocket().emit('typing:stop', roomId);
  }, [roomId]);

  return { typers, notifyTyping, stopTyping };
}