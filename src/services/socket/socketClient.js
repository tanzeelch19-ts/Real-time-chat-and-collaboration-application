import { io } from 'socket.io-client';
import { getAccessToken } from '@/services/api/tokenStorage';

let socket = null;

/**
 * One authenticated socket per browser tab. The token is read on every (re)connect,
 * so a refreshed login is picked up automatically.
 */
export function connectSocket() {
  if (socket) return socket;
  socket = io({
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: (callback) => callback({ token: getAccessToken() }),
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}