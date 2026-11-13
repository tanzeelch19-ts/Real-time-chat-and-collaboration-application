/**
 * In-memory store for the mock API. Saved to data/db.json by lib/persist.js.
 */
export const db = {
  users: [],
  sessions: new Map(),
  resetTokens: new Map(),
  workspaces: [],
  memberships: [],
  channels: [],
  channelMembers: [],
  invitations: new Map(),
  conversations: [],
  conversationMembers: [],
  messages: [],
  reactions: [],
  attachments: [],
  notifications: [],
  audit: [],
  pins: [],
  savedMessages: [],
  meetings: [],
  reads: [],
  mutes: [], // { userId, roomId }
};

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const RESET_TTL_MS = 30 * 60 * 1000;
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Removes every item that matches `predicate`, in place. */
export function removeWhere(list, predicate) {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (predicate(list[i])) list.splice(i, 1);
  }
}