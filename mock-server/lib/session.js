import { randomBytes } from 'node:crypto';
import { db, SESSION_TTL_MS } from '../data/store.js';

export function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  db.sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function getSession(token) {
  const session = db.sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    db.sessions.delete(token);
    return null;
  }
  return session;
}
