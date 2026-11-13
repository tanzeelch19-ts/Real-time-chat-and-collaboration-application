import { db } from '../data/store.js';
import { canSeeChannel, getMembership } from './workspaceService.js';

/** Room ids look like "channel:<id>" or "conversation:<id>". */
export function parseRoomId(value) {
  if (typeof value !== 'string') return null;
  const separator = value.indexOf(':');
  if (separator < 0) return null;
  const kind = value.slice(0, separator);
  const id = value.slice(separator + 1);
  if ((kind !== 'channel' && kind !== 'conversation') || !id) return null;
  return { kind, id };
}

/**
 * Returns { roomId, workspaceId, kind } when the user may read and post in the room.
 * Returns null otherwise. Callers answer "not found" in both cases, so room ids cannot be probed.
 */
export function resolveRoomAccess(roomId, userId) {
  const parsed = parseRoomId(roomId);
  if (!parsed) return null;

  if (parsed.kind === 'channel') {
    const channel = db.channels.find((c) => c.id === parsed.id);
    if (!channel) return null;
    const membership = getMembership(channel.workspaceId, userId);
    if (!membership || !canSeeChannel(channel, membership.role, userId)) return null;
    return { roomId, workspaceId: channel.workspaceId, kind: 'channel' };
  }

  const conversation = db.conversations.find((c) => c.id === parsed.id);
  if (!conversation) return null;
  const isMember = db.conversationMembers.some(
    (cm) => cm.conversationId === conversation.id && cm.userId === userId,
  );
  if (!isMember) return null;
  return { roomId, workspaceId: conversation.workspaceId, kind: 'conversation' };
}