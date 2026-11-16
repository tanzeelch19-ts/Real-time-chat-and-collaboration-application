import { db } from '../data/store.js';
import { notifyForMessage } from './notificationService.js';
import { isAdminOrAbove } from './permissions.js';
import { resolveRoomAccess } from './rooms.js';
import {
  createMessage,
  findMessage,
  listMessages,
  removeReactions,
  toMessageView,
  validateMessageBody,
} from './messageService.js';
import { getMembership } from './workspaceService.js';
import { isArchivedRoom } from './channelExtras.js';
import { recordAudit } from './auditService.js';

/** Escaped so this file stays plain ASCII. */
export const ALLOWED_EMOJI = [
  '\u{1F44D}',
  '\u2764\uFE0F',
  '\u{1F602}',
  '\u{1F389}',
  '\u{1F440}',
  '\u{1F64F}',
  '\u{1F44E}',
  '\u{1F600}',
  '\u{1F60D}',
  '\u{1F642}',
  '\u{1F62E}',
  '\u{1F622}',
  '\u{1F914}',
  '\u{1F44F}',
  '\u{1F525}',
  '\u{1F680}',
  '\u{1F4AF}',
  '\u2705',
];

/**
 * Every action returns either { ok: true, message, changed } or { ok: false, status, code, message, details }.
 * `changed` lists message views the caller must broadcast as "message:updated".
 */
function fail(status, code, message, details = []) {
  return { ok: false, status, code, message, details };
}

const roomNotFound = () => fail(404, 'NOT_FOUND', 'Conversation not found.');
const messageNotFound = () => fail(404, 'NOT_FOUND', 'Message not found.');
const invalidField = (field, message) =>
  fail(422, 'VALIDATION_ERROR', 'Please fix the highlighted fields.', [{ field, message }]);

/** Threads stay one level deep: replies to replies are not allowed. */
function canBeReplied(message) {
  return Boolean(message) && !message.deletedAt && !message.threadId;
}

export function listRoomMessages({ roomId, userId, before, limit, threadId }) {
  if (!resolveRoomAccess(roomId, userId)) return roomNotFound();
  if (threadId && !findMessage(roomId, threadId)) return messageNotFound();
  return { ok: true, page: listMessages(roomId, { before, limit, threadId: threadId ?? null }) };
}

export function sendMessage({ roomId, userId, body, threadId = null }) {
  if (!resolveRoomAccess(roomId, userId)) return roomNotFound();
  const problem = validateMessageBody(body);
  if (problem) return invalidField('body', problem);

  let parent = null;
  if (threadId) {
    parent = findMessage(roomId, threadId);
    if (!canBeReplied(parent)) {
      return invalidField('threadId', 'You can only reply to a channel message.');
    }
  }

  if (isArchivedRoom(roomId))
    return fail(409, 'CONFLICT', 'This channel is archived. Nobody can post in it.');
  if (isArchivedRoom(roomId))
    return fail(409, 'CONFLICT', 'This channel is archived. Nobody can post in it.');
  const message = createMessage({ roomId, authorId: userId, body: body.trim(), threadId });
  notifyForMessage({
    roomId,
    messageId: message.id,
    authorId: userId,
    body: message.body,
    parentAuthorId: parent ? parent.authorId : null,
  });

  // Built after the new reply exists, so the parent's replyCount is up to date.
  const changed = parent ? [toMessageView(parent)] : [];
  return { ok: true, message: toMessageView(message), changed };
}

export function editMessage({ roomId, userId, messageId, body }) {
  if (!resolveRoomAccess(roomId, userId)) return roomNotFound();
  const message = findMessage(roomId, messageId);
  if (!message) return messageNotFound();
  if (message.authorId !== userId) {
    return fail(403, 'FORBIDDEN', 'You can only edit your own messages.');
  }
  if (message.deletedAt) return fail(409, 'CONFLICT', 'A deleted message cannot be edited.');

  const problem = validateMessageBody(body);
  if (problem) return invalidField('body', problem);

  message.body = body.trim();
  message.editedAt = new Date().toISOString();
  const view = toMessageView(message);
  return { ok: true, message: view, changed: [view] };
}

export function deleteMessage({ roomId, userId, messageId }) {
  const access = resolveRoomAccess(roomId, userId);
  if (!access) return roomNotFound();
  const message = findMessage(roomId, messageId);
  if (!message || message.deletedAt) return messageNotFound();

  const isAuthor = message.authorId === userId;
  const role = getMembership(access.workspaceId, userId)?.role;
  // Owners and admins can moderate channels. Direct and group messages are deleted only by their author.
  const isModerator = access.kind === 'channel' && isAdminOrAbove(role);
  if (!isAuthor && !isModerator) {
    return fail(403, 'FORBIDDEN', 'You cannot delete this message.');
  }

  if (!isAuthor)
    recordAudit({
      workspaceId: access.workspaceId,
      actorId: userId,
      action: 'message.delete',
      targetType: 'message',
      targetId: messageId,
      summary: 'Deleted a channel message',
    });
  message.deletedAt = new Date().toISOString();
  message.body = '';
  removeReactions(message.id);

  const changed = [toMessageView(message)];
  if (message.threadId) {
    const parent = findMessage(roomId, message.threadId);
    if (parent) changed.push(toMessageView(parent));
  }
  return { ok: true, message: changed[0], changed };
}

/** Adds the reaction if it is missing, otherwise removes it. */
export function toggleReaction({ roomId, userId, messageId, emoji }) {
  if (!resolveRoomAccess(roomId, userId)) return roomNotFound();
  if (!ALLOWED_EMOJI.includes(emoji)) return invalidField('emoji', 'That reaction is not available.');
  const message = findMessage(roomId, messageId);
  if (!message || message.deletedAt) return messageNotFound();

  const index = db.reactions.findIndex(
    (r) => r.messageId === messageId && r.userId === userId && r.emoji === emoji,
  );
  if (index >= 0) db.reactions.splice(index, 1);
  else db.reactions.push({ messageId, userId, emoji });

  const view = toMessageView(message);
  return { ok: true, message: view, changed: [view] };
}
