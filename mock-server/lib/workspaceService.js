import { randomUUID } from 'node:crypto';
import { db } from '../data/store.js';
import { isAdminOrAbove } from './permissions.js';

export function getMembership(workspaceId, userId) {
  return db.memberships.find((m) => m.workspaceId === workspaceId && m.userId === userId) ?? null;
}

export function addMembership(workspaceId, userId, role) {
  const existing = getMembership(workspaceId, userId);
  if (existing) return existing;
  const membership = { workspaceId, userId, role, joinedAt: new Date().toISOString() };
  db.memberships.push(membership);
  return membership;
}

export function isChannelMember(channelId, userId) {
  return db.channelMembers.some((cm) => cm.channelId === channelId && cm.userId === userId);
}

export function addChannelMember(channelId, userId) {
  if (!isChannelMember(channelId, userId)) {
    db.channelMembers.push({ channelId, userId });
  }
}

export function createChannel({ workspaceId, name, visibility, creatorId }) {
  const channel = {
    id: randomUUID(),
    workspaceId,
    name,
    visibility,
    createdBy: creatorId,
    createdAt: new Date().toISOString(),
  };
  db.channels.push(channel);
  return channel;
}

/** Creates a workspace, makes the creator its owner, and adds a public #general channel. */
export function createWorkspace({ name, creatorId }) {
  const workspace = {
    id: randomUUID(),
    name,
    createdBy: creatorId,
    createdAt: new Date().toISOString(),
  };
  db.workspaces.push(workspace);
  addMembership(workspace.id, creatorId, 'owner');
  const general = createChannel({
    workspaceId: workspace.id,
    name: 'general',
    visibility: 'public',
    creatorId,
  });
  return { workspace, general };
}

/**
 * Who can see a channel:
 * - owner and admin: every channel (moderation view)
 * - member: public channels, plus private channels they were added to
 * - guest: only channels they were explicitly added to
 */
export function canSeeChannel(channel, role, userId) {
  if (isAdminOrAbove(role)) return true;
  if (role === 'member' && channel.visibility === 'public') return true;
  return isChannelMember(channel.id, userId);
}

export function toWorkspaceView(workspace, role) {
  return {
    id: workspace.id,
    name: workspace.name,
    createdAt: workspace.createdAt,
    myRole: role,
  };
}

export function toChannelView(channel) {
  return {
    id: channel.id,
    workspaceId: channel.workspaceId,
    name: channel.name,
    visibility: channel.visibility,
    topic: channel.topic ?? '',
    description: channel.description ?? '',
    archivedAt: channel.archivedAt ?? null,
    createdBy: channel.createdBy,
    createdAt: channel.createdAt,
  };
}

/** Only public profile fields. Email is never shared with other members. */
export function toMemberView(membership) {
  const user = db.users.find((u) => u.id === membership.userId);
  return {
    userId: membership.userId,
    role: membership.role,
    joinedAt: membership.joinedAt,
    displayName: user?.displayName ?? 'Unknown user',
    avatarUrl: user?.avatarUrl ?? '',
    statusMessage: user?.statusMessage ?? '',
  };
}

export function listMembers(workspaceId) {
  return db.memberships.filter((m) => m.workspaceId === workspaceId).map(toMemberView);
}
