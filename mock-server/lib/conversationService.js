import { randomUUID } from 'node:crypto';
import { db } from '../data/store.js';

const userById = (id) => db.users.find((u) => u.id === id);

export function membersOf(conversationId) {
  return db.conversationMembers.filter((cm) => cm.conversationId === conversationId).map((cm) => cm.userId);
}

function findDirect(workspaceId, a, b) {
  return db.conversations.find((c) => {
    if (c.workspaceId !== workspaceId || c.kind !== 'direct') return false;
    const ids = membersOf(c.id);
    return ids.length === 2 && ids.includes(a) && ids.includes(b);
  });
}

function defaultGroupName(ids) {
  return ids.map((id) => userById(id)?.displayName.split(' ')[0] ?? 'User').join(', ');
}

/**
 * Two people share one direct conversation, so opening it again returns the same one.
 * Three or more people create a new group conversation each time.
 * Callers must check that every person is a workspace member first.
 */
export function openConversation({ workspaceId, creatorId, userIds, name }) {
  const everyone = [...new Set([creatorId, ...userIds])];

  if (everyone.length === 2) {
    const other = everyone.find((id) => id !== creatorId);
    const existing = findDirect(workspaceId, creatorId, other);
    if (existing) return { conversation: existing, created: false };
  }

  const isDirect = everyone.length === 2;
  const conversation = {
    id: randomUUID(),
    workspaceId,
    kind: isDirect ? 'direct' : 'group',
    name: isDirect ? '' : name?.trim() || defaultGroupName(everyone),
    createdBy: creatorId,
    createdAt: new Date().toISOString(),
  };
  db.conversations.push(conversation);
  for (const userId of everyone) {
    db.conversationMembers.push({ conversationId: conversation.id, userId });
  }
  return { conversation, created: true };
}

/** The name is shown from the viewer's side: a direct message is named after the other person. */
export function toConversationView(conversation, viewerId) {
  const members = membersOf(conversation.id).map((userId) => {
    const user = userById(userId);
    return {
      userId,
      displayName: user?.displayName ?? 'Unknown user',
      avatarUrl: user?.avatarUrl ?? '',
    };
  });

  let name = conversation.name;
  if (conversation.kind === 'direct') {
    name = members.find((m) => m.userId !== viewerId)?.displayName ?? 'Direct message';
  }

  return {
    id: conversation.id,
    roomId: `conversation:${conversation.id}`,
    workspaceId: conversation.workspaceId,
    kind: conversation.kind,
    name,
    members,
    createdAt: conversation.createdAt,
  };
}
