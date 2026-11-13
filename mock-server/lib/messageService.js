import { randomUUID } from 'node:crypto';
import { db, removeWhere } from '../data/store.js';
import { listAttachmentViews } from './attachmentService.js';

export const MAX_MESSAGE_LENGTH = 4000;

/** Returns an error message, or null when the body is acceptable. */
export function validateMessageBody(value) {
  if (typeof value !== 'string') return 'Message is required.';
  const trimmed = value.trim();
  if (!trimmed) return 'Message cannot be empty.';
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`;
  }
  return null;
}

export function findMessage(roomId, messageId) {
  return db.messages.find((m) => m.id === messageId && m.roomId === roomId) ?? null;
}

export function createMessage({ roomId, authorId, body, threadId = null }) {
  const message = {
    id: randomUUID(),
    roomId,
    threadId,
    authorId,
    body,
    createdAt: new Date().toISOString(),
    editedAt: null,
    deletedAt: null,
  };
  db.messages.push(message);
  return message;
}

export function removeReactions(messageId) {
  removeWhere(db.reactions, (r) => r.messageId === messageId);
}

/** Reactions grouped by emoji. The client checks its own id in userIds. */
function reactionSummary(messageId) {
  const grouped = new Map();
  for (const reaction of db.reactions) {
    if (reaction.messageId !== messageId) continue;
    if (!grouped.has(reaction.emoji)) grouped.set(reaction.emoji, []);
    grouped.get(reaction.emoji).push(reaction.userId);
  }
  return [...grouped].map(([emoji, userIds]) => ({ emoji, count: userIds.length, userIds }));
}

function replyCount(messageId) {
  return db.messages.filter((m) => m.threadId === messageId && !m.deletedAt).length;
}

/**
 * Public shape of a message. Deleted messages keep their place in the list,
 * but their body, reactions, and attachments are hidden.
 */
export function toMessageView(message) {
  const author = db.users.find((u) => u.id === message.authorId);
  const deleted = Boolean(message.deletedAt);
  return {
    id: message.id,
    roomId: message.roomId,
    threadId: message.threadId ?? null,
    body: deleted ? '' : message.body,
    createdAt: message.createdAt,
    editedAt: message.editedAt,
    deletedAt: message.deletedAt,
    author: {
      id: message.authorId,
      displayName: author?.displayName ?? 'Unknown user',
      avatarUrl: author?.avatarUrl ?? '',
    },
    replyCount: replyCount(message.id),
    reactions: deleted ? [] : reactionSummary(message.id),
    attachments: deleted ? [] : listAttachmentViews(message.id),
  };
}

/**
 * Returns a page in oldest-to-newest order.
 * threadId null returns channel-level messages. A thread id returns that thread's replies.
 * `before` is a message id. `nextCursor` is the id to pass as `before` for the next older page.
 */
export function listMessages(roomId, { before, limit = 30, threadId = null }) {
  let list = db.messages
    .filter((m) => m.roomId === roomId && (m.threadId ?? null) === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  if (before) {
    const index = list.findIndex((m) => m.id === before);
    if (index >= 0) list = list.slice(0, index);
  }

  const page = list.slice(-limit);
  const nextCursor = list.length > page.length ? page[0].id : null;
  return { messages: page.map((m) => toMessageView(m)), nextCursor };
}