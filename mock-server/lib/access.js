import { db } from '../data/store.js';
import { ApiError } from './apiError.js';

/** Higher number means more access. */
export const ROLE_RANK = { guest: 1, member: 2, admin: 3, owner: 4 };

export const roleAtLeast = (role, minRole) => (ROLE_RANK[role] ?? 0) >= ROLE_RANK[minRole];

export function findWorkspace(workspaceId) {
  return db.workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
}

export function findMembership(userId, workspaceId) {
  return db.memberships.find((m) => m.userId === userId && m.workspaceId === workspaceId) ?? null;
}

export function findChannel(channelId) {
  return db.channels.find((channel) => channel.id === channelId) ?? null;
}

/**
 * Guests only see channels they were added to. Everyone else sees public
 * channels plus the private channels they belong to.
 */
export function canSeeChannel(channel, membership) {
  if (!membership) return false;
  const isChannelMember = channel.memberIds.includes(membership.userId);
  if (membership.role === 'guest') return isChannelMember;
  return channel.visibility === 'public' || isChannelMember;
}

/**
 * Loads the workspace and the caller's membership. Non-members get a 404 so
 * that the workspace's existence is not revealed.
 */
export function loadWorkspace(req, _res, next) {
  const workspace = findWorkspace(req.params.workspaceId);
  const membership = workspace ? findMembership(req.user.id, workspace.id) : null;
  if (!workspace || !membership) {
    return next(new ApiError(404, 'NOT_FOUND', 'Workspace not found.'));
  }
  req.workspace = workspace;
  req.membership = membership;
  return next();
}

/** Must run after loadWorkspace. */
export function requireWorkspaceRole(minRole) {
  return (req, _res, next) => {
    if (!roleAtLeast(req.membership.role, minRole)) {
      return next(new ApiError(403, 'FORBIDDEN', `This action needs the ${minRole} role or higher.`));
    }
    return next();
  };
}

export function workspaceView(workspace, role) {
  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    createdAt: workspace.createdAt,
    role,
    memberCount: db.memberships.filter((m) => m.workspaceId === workspace.id).length,
  };
}

export function memberView(membership) {
  const user = db.users.find((candidate) => candidate.id === membership.userId);
  return {
    userId: membership.userId,
    displayName: user?.displayName ?? 'Unknown user',
    email: user?.email ?? '',
    avatarUrl: user?.avatarUrl ?? '',
    role: membership.role,
    joinedAt: membership.joinedAt,
  };
}

export function channelView(channel, membership) {
  return {
    id: channel.id,
    workspaceId: channel.workspaceId,
    name: channel.name,
    description: channel.description,
    visibility: channel.visibility,
    createdAt: channel.createdAt,
    memberCount: channel.memberIds.length,
    isMember: channel.memberIds.includes(membership.userId),
  };
}

/** Never includes the invitation token. */
export function invitationView(invitation) {
  return {
    id: invitation.id,
    workspaceId: invitation.workspaceId,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    createdAt: invitation.createdAt,
    expiresAt: new Date(invitation.expiresAt).toISOString(),
  };
}