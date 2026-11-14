  import { Server } from 'socket.io';
import { db } from '../data/store.js';
import { deleteMessage, editMessage, sendMessage, toggleReaction } from '../lib/messageActions.js';
import { saveDb } from '../lib/persist.js';
import { resolveRoomAccess } from '../lib/rooms.js';
import { getSession } from '../lib/session.js';
import { setIo } from '../realtime/hub.js';
import { awayUserIds, markConnected, markDisconnected, onlineUserIds, startAwaySweep, touchActivity } from './presence.js';

function reply(ack, payload) {
  if (typeof ack === 'function') ack(payload);
}

const displayNameOf = (userId) => db.users.find((u) => u.id === userId)?.displayName ?? 'Someone';

/**
 * Attaches Socket.IO to the Vite dev server's HTTP server, so the browser keeps using
 * one port. Clients send their access token in the handshake.
 *
 * Client -> server:
 *   room:join            (roomId, ack)
 *   room:leave           (roomId)
 *   message:send         ({ roomId, body, threadId?, clientId }, ack)
 *   message:edit         ({ roomId, messageId, body }, ack)
 *   message:delete       ({ roomId, messageId }, ack)
 *   reaction:toggle      ({ roomId, messageId, emoji }, ack)
 *   typing:start         (roomId)
 *   typing:stop          (roomId)
 *
 * Server -> client:
 *   message:new          (message)                 room subscribers except the sender
 *   message:updated      (message)                 room subscribers, including the sender
 *   typing:update        ({ roomId, userId, displayName, typing })
 *   presence:snapshot    ({ userIds })              sent once on connect
 *   presence:update      ({ userId, online })       everyone connected
 *   conversation:created (conversation)            one user
 */
export function attachRealtime(httpServer) {
  const socketOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: socketOrigins.length ? socketOrigins : false },
  });
  setIo(io);
  startAwaySweep(io);

  const publish = (roomId, views) => {
    for (const view of views) io.to(roomId).emit('message:updated', view);
  };

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const session = typeof token === 'string' && token ? getSession(token) : null;
    const user = session ? db.users.find((u) => u.id === session.userId) : null;
    if (!user) return next(new Error('UNAUTHORIZED'));
    socket.data.userId = user.id;
    return next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    if (markConnected(userId)) io.emit('presence:update', { userId, online: true });
    socket.emit('presence:snapshot', { userIds: onlineUserIds(), awayIds: awayUserIds() });

    socket.on('room:join', (roomId, ack) => {
      const access = resolveRoomAccess(roomId, userId);
      if (!access) return reply(ack, { ok: false, error: 'Room not found.' });
      socket.join(roomId);
      return reply(ack, { ok: true });
    });

    socket.on('presence:activity', () => touchActivity(userId));
    socket.on('room:leave', (roomId) => {
      if (typeof roomId === 'string') socket.leave(roomId);
    });

    socket.on('message:send', (payload, ack) => {
      const { roomId, body, threadId, clientId } = payload ?? {};
      const result = sendMessage({ roomId, userId, body, threadId: threadId ?? null });
      if (!result.ok) return reply(ack, { ok: false, clientId, error: result.message });

      saveDb();
      // The sender receives the saved message through the ack, so it is excluded here.
      socket.to(roomId).emit('message:new', result.message);
      publish(roomId, result.changed);
      return reply(ack, { ok: true, clientId, message: result.message });
    });

    socket.on('message:edit', (payload, ack) => {
      const { roomId, messageId, body } = payload ?? {};
      const result = editMessage({ roomId, userId, messageId, body });
      if (!result.ok) return reply(ack, { ok: false, error: result.message });

      saveDb();
      publish(roomId, result.changed);
      return reply(ack, { ok: true, message: result.message });
    });

    socket.on('message:delete', (payload, ack) => {
      const { roomId, messageId } = payload ?? {};
      const result = deleteMessage({ roomId, userId, messageId });
      if (!result.ok) return reply(ack, { ok: false, error: result.message });

      saveDb();
      publish(roomId, result.changed);
      return reply(ack, { ok: true, message: result.message });
    });

    socket.on('reaction:toggle', (payload, ack) => {
      const { roomId, messageId, emoji } = payload ?? {};
      const result = toggleReaction({ roomId, userId, messageId, emoji });
      if (!result.ok) return reply(ack, { ok: false, error: result.message });

      saveDb();
      publish(roomId, result.changed);
      return reply(ack, { ok: true, message: result.message });
    });

    const relayTyping = (roomId, typing) => {
      if (!resolveRoomAccess(roomId, userId)) return;
      socket.to(roomId).emit('typing:update', {
        roomId,
        userId,
        displayName: displayNameOf(userId),
        typing,
      });
    };
    socket.on('typing:start', (roomId) => relayTyping(roomId, true));
    socket.on('typing:stop', (roomId) => relayTyping(roomId, false));

    socket.on('disconnect', () => {
      if (markDisconnected(userId)) io.emit('presence:update', { userId, online: false });
    });
  });

  return io;
}