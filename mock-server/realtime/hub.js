/**
 * Lets REST routes push events to connected clients without importing the socket server.
 */
let io = null;

export function setIo(instance) {
  io = instance;
}

/** Sends to everyone currently subscribed to the room. */
export function emitToRoom(roomId, event, payload) {
  io?.to(roomId).emit(event, payload);
}

/** Sends to every open connection of one user. */
export function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}
