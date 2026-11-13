import { randomUUID } from 'node:crypto';
import { db } from '../data/store.js';
import { emitToUser } from '../realtime/hub.js';
import { membersOf } from './conversationService.js';
import { parseRoomId } from './rooms.js';
import { isMuted } from './roomSettings.js';
import { canSeeChannel, getMembership } from './workspaceService.js';

/** Every kind is on by default. A user can switch each one off on the preferences page. */
const DEFAULT_PREFS = { mentions: true, replies: true, direct: true };
const KIND_TO_PREF = { mention: 'mentions', reply: 'replies', direct: 'direct' };

export function preferencesOf(user) {
  return { ...DEFAULT_PREFS, ...(user?.notificationPrefs ?? {}) };
}

const nameOf = (userId) => db.users.find((u) => u.id === userId)?.displayName ?? '';
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CHANNEL_WIDE = /(^|\s)@channel(?![\p{L}\p{N}_])/iu;

export function mentionsEveryone(body) {
  return CHANNEL_WIDE.test(body);
}

/**
 * Finds people written as "@Full Name" in the body. Longer names are matched first,
 * and matched text is blanked, so "@Ayesha Owner" does not also count as "@Ayesha".
 */
export function findMentionedUserIds(body, candidates) {
  const found = new Set();
  let remaining = body;
  const byLength = [...candidates]
    .filter((c) => c.displayName)
    .sort((a, b) => b.displayName.length - a.displayName.length);

  for (const candidate of byLength) {
    const pattern = new RegExp(`@${escapeRegExp(candidate.displayName)}(?![\\p{L}\\p{N}_])`, 'iu');
    if (pattern.test(remaining)) {
      found.add(candidate.userId);
      remaining = remaining.replace(pattern, ' ');
    }
  }
  return [...found];
}

/** Who could be notified in this room, plus the workspace it belongs to. */
function describeRoom(roomId) {
  const parsed = parseRoomId(roomId);
  if (!parsed) return null;

  if (parsed.kind === 'channel') {
    const channel = db.channels.find((c) => c.id === parsed.id);
    if (!channel) return null;
    const candidates = db.memberships
      .filter((m) => m.workspaceId === channel.workspaceId && canSeeChannel(channel, m.role, m.userId))
      .map((m) => ({ userId: m.userId, displayName: nameOf(m.userId) }));
    return { kind: 'channel', workspaceId: channel.workspaceId, candidates };
  }

  const conversation = db.conversations.find((c) => c.id === parsed.id);
  if (!conversation) return null;
  return {
    kind: 'conversation',
    workspaceId: conversation.workspaceId,
    candidates: membersOf(conversation.id).map((userId) => ({ userId, displayName: nameOf(userId) })),
  };
}

/**
 * Creates notifications for a new message and pushes each one to the recipient.
 * Priority per person: mention, then reply, then direct message. Switched-off kinds
 * and muted rooms are skipped.
 */
export function notifyForMessage({ roomId, messageId, authorId, body, parentAuthorId = null }) {
  const room = describeRoom(roomId);
  if (!room) return [];

  const allowed = new Set(room.candidates.map((c) => c.userId));
  const planned = new Map();
  const plan = (userId, kind) => {
    if (!userId || userId === authorId || planned.has(userId) || !allowed.has(userId)) return;
    const user = db.users.find((u) => u.id === userId);
    if (!preferencesOf(user)[KIND_TO_PREF[kind]]) return;
    if (isMuted(userId, roomId)) return;
    planned.set(userId, kind);
  };

  // @channel reaches everyone who can see the channel, but only owners and admins may use it.
  if (room.kind === 'channel' && mentionsEveryone(body)) {
    const role = getMembership(room.workspaceId, authorId)?.role;
    if (role === 'owner' || role === 'admin') {
      for (const candidate of room.candidates) plan(candidate.userId, 'mention');
    }
  }

  for (const userId of findMentionedUserIds(body, room.candidates)) plan(userId, 'mention');
  if (parentAuthorId) plan(parentAuthorId, 'reply');
  if (room.kind === 'conversation' && room.candidates.length === 2) {
    for (const candidate of room.candidates) plan(candidate.userId, 'direct');
  }

  const createdAt = new Date().toISOString();
  const created = [];
  for (const [userId, kind] of planned) {
    const notification = {
      id: randomUUID(),
      userId,
      kind,
      workspaceId: room.workspaceId,
      roomId,
      messageId,
      actorId: authorId,
      preview: body.slice(0, 140),
      createdAt,
      readAt: null,
    };
    db.notifications.push(notification);
    created.push(notification);
    emitToUser(userId, 'notification:new', toNotificationView(notification));
  }
  return created;
}

export function toNotificationView(notification) {
  return {
    id: notification.id,
    kind: notification.kind,
    workspaceId: notification.workspaceId,
    roomId: notification.roomId,
    messageId: notification.messageId,
    actor: { id: notification.actorId, displayName: nameOf(notification.actorId) || 'Someone' },
    preview: notification.preview,
    createdAt: notification.createdAt,
    readAt: notification.readAt,
  };
}

export function listNotifications(userId, { unreadOnly = false, limit = 50 } = {}) {
  const mine = db.notifications.filter((n) => n.userId === userId);
  const notifications = mine
    .filter((n) => !unreadOnly || !n.readAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(toNotificationView);
  return { notifications, unreadCount: mine.filter((n) => !n.readAt).length };
}

/** Unread total and unread counts per room, for sidebar badges. */
export function notificationSummary(userId) {
  const byRoom = {};
  let total = 0;
  for (const n of db.notifications) {
    if (n.userId !== userId || n.readAt) continue;
    total += 1;
    byRoom[n.roomId] = (byRoom[n.roomId] ?? 0) + 1;
  }
  return { total, byRoom };
}

export function markNotificationRead(userId, notificationId) {
  const notification = db.notifications.find((n) => n.id === notificationId && n.userId === userId);
  if (!notification) return null;
  if (!notification.readAt) notification.readAt = new Date().toISOString();
  return toNotificationView(notification);
}

export function markAllRead(userId, workspaceId = null) {
  const now = new Date().toISOString();
  for (const n of db.notifications) {
    if (n.userId === userId && !n.readAt && (!workspaceId || n.workspaceId === workspaceId)) {
      n.readAt = now;
    }
  }
}

export function markRoomRead(userId, roomId) {
  const now = new Date().toISOString();
  for (const n of db.notifications) {
    if (n.userId === userId && !n.readAt && n.roomId === roomId) n.readAt = now;
  }
}