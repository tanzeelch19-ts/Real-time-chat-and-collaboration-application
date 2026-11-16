import { db } from '../data/store.js';
import { membersOf, toConversationView } from './conversationService.js';
import { toMessageView } from './messageService.js';
import { canSeeChannel, getMembership } from './workspaceService.js';

/** Map of roomId -> title for every room this user can read in the workspace. */
export function accessibleRooms(workspaceId, userId) {
  const rooms = new Map();
  const membership = getMembership(workspaceId, userId);
  if (!membership) return rooms;

  for (const channel of db.channels) {
    if (channel.workspaceId !== workspaceId) continue;
    if (!canSeeChannel(channel, membership.role, userId)) continue;
    rooms.set(`channel:${channel.id}`, `#${channel.name}`);
  }
  for (const conversation of db.conversations) {
    if (conversation.workspaceId !== workspaceId) continue;
    if (!membersOf(conversation.id).includes(userId)) continue;
    rooms.set(`conversation:${conversation.id}`, toConversationView(conversation, userId).name);
  }
  return rooms;
}

/**
 * Search across rooms the user can read. Every filter is optional and they combine:
 * query (case-insensitive text), senderId, roomId, from and to (ISO timestamps), hasAttachments.
 */
export function searchMessages({
  workspaceId,
  userId,
  query = '',
  roomId = null,
  senderId = null,
  from = null,
  to = null,
  hasAttachments = false,
  limit = 20,
}) {
  const rooms = accessibleRooms(workspaceId, userId);
  const needle = query.trim().toLowerCase();
  const withAttachments = new Set(db.attachments.map((a) => a.messageId).filter(Boolean));

  return db.messages
    .filter((m) => !m.deletedAt && rooms.has(m.roomId))
    .filter((m) => !roomId || m.roomId === roomId)
    .filter((m) => !senderId || m.authorId === senderId)
    .filter((m) => !from || m.createdAt >= from)
    .filter((m) => !to || m.createdAt <= to)
    .filter((m) => !hasAttachments || withAttachments.has(m.id))
    .filter((m) => !needle || m.body.toLowerCase().includes(needle))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((m) => ({ ...toMessageView(m), roomTitle: rooms.get(m.roomId) }));
}
