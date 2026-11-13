import { io } from 'socket.io-client';
import { getAccessToken } from '@/services/api/tokenStorage';

let socket = null;

/**
 * One authenticated socket per browser tab. The token is read on every (re)connect,
 * so a refreshed login is picked up automatically.
 * VITE_SOCKET_URL is set when the realtime server lives on another origin (for example
 * on Vercel). Leave it empty to use the same origin as the page, as in local dev.
 */
export function connectSocket() {
  if (socket) return socket;
  const options = {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: (callback) => callback({ token: getAccessToken() }),
  };
  const socketUrl = import.meta.env.VITE_SOCKET_URL;
  socket = socketUrl ? io(socketUrl, options) : io(options);
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}