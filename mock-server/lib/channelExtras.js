import { db } from '../data/store.js';

/** Unread = room messages (not thread replies, not your own, not deleted) since your last read. */
export function unreadCountFor(roomId, userId) {
  const read = db.reads.find((r) => r.userId === userId && r.roomId === roomId);
  const since = read ? read.lastReadAt : null;
  return db.messages.filter(
    (m) =>
      m.roomId === roomId &&
      !m.threadId &&
      !m.deletedAt &&
      m.authorId !== userId &&
      (!since || m.createdAt > since),
  ).length;
}

export function markRoomReadAt(roomId, userId) {
  const now = new Date().toISOString();
  const existing = db.reads.find((r) => r.userId === userId && r.roomId === roomId);
  if (existing) existing.lastReadAt = now;
  else db.reads.push({ userId, roomId, lastReadAt: now });
}

/** True when the room is a channel that has been archived. Archived channels are read-only. */
export function isArchivedRoom(roomId) {
  if (!roomId.startsWith('channel:')) return false;
  const channel = db.channels.find((c) => c.id === roomId.slice('channel:'.length));
  return Boolean(channel?.archivedAt);
}

/** Applies only the fields that were sent. undefined means "leave unchanged". */
export function updateChannelDetails(channel, patch) {
  if (patch.topic !== undefined) channel.topic = patch.topic;
  if (patch.description !== undefined) channel.description = patch.description;
  if (patch.archived !== undefined) channel.archivedAt = patch.archived ? new Date().toISOString() : null;
}
