import { db } from '../data/store.js';

/** A muted room sends no notifications to that user. Messages still arrive. */
export function isMuted(userId, roomId) {
  return db.mutes.some((m) => m.userId === userId && m.roomId === roomId);
}

export function setMuted(userId, roomId, muted) {
  const index = db.mutes.findIndex((m) => m.userId === userId && m.roomId === roomId);
  if (muted && index < 0) db.mutes.push({ userId, roomId });
  if (!muted && index >= 0) db.mutes.splice(index, 1);
  return muted;
}
