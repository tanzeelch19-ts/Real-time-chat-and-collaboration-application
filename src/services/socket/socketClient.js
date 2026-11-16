import { io } from 'socket.io-client';
import { getAccessToken } from '@/services/api/tokenStorage';

let socket = null;

/**
 * One authenticated socket per browser tab. VITE_SOCKET_URL points at the backend when the
 * frontend is hosted elsewhere. When it is empty, the socket uses the same origin.
 */
export function connectSocket() {
  if (socket) return socket;
  const url = import.meta.env.VITE_SOCKET_URL || undefined;
  socket = io(url, {
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
