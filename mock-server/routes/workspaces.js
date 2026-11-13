import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { db, INVITE_TTL_MS, removeWhere } from '../data/store.js';
import { ApiError } from '../lib/apiError.js';
import { recordAudit } from '../lib/auditService.js';
import { invitationStatus } from '../lib/invitationStatus.js';
import { can } from '../lib/permissions.js';
import { assertValid } from '../lib/validate.js';
import {
  validateInviteRole,
  validateMemberRole,
  validateWorkspaceName,
} from '../lib/validateWorkspace.js';
import { requireMembership, requirePermission } from '../lib/workspaceAccess.js';
import {
  createWorkspace,
  getMembership,
  listMembers,
  toMemberView,
  toWorkspaceView,
} from '../lib/workspaceService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

function toInvitationView(token, invite) {
  return {
    token,
    role: invite.role,
    createdBy: invite.createdBy,
    expiresAt: new Date(invite.expiresAt).toISOString(),
    status: invitationStatus(invite),
    path: `/invite/${token}`,
  };
}

// Workspaces

router.get('/', (req, res) => {
  const workspaces = db.memberships
    .filter((m) => m.userId === req.user.id)
    .map((m) => {
      const workspace = db.workspaces.find((w) => w.id === m.workspaceId);
      return workspace ? toWorkspaceView(workspace, m.role) : null;
    })
    .filter(Boolean);
  res.json({ workspaces });
});

router.post('/', (req, res) => {
  const { name } = req.body ?? {};
  assertValid({ name: validateWorkspaceName(name) });
  const { workspace } = createWorkspace({ name: name.trim(), creatorId: req.user.id });
  res.status(201).json({ workspace: toWorkspaceView(workspace, 'owner') });
});

router.get('/:workspaceId', requireMembership, (req, res) => {
  res.json({ workspace: toWorkspaceView(req.workspace, req.membership.role) });
});

router.patch(
  '/:workspaceId',
  requireMembership,
  requirePermission('workspace:update'),
  (req, res) => {
    const { name } = req.body ?? {};
    assertValid({ name: validateWorkspaceName(name) });
    req.workspace.name = name.trim();
    res.json({ workspace: toWorkspaceView(req.workspace, req.membership.role) });
  },
);

router.delete(
  '/:workspaceId',
  requireMembership,
  requirePermission('workspace:delete'),
  (req, res) => {
    const workspaceId = req.workspace.id;
    const channelIds = db.channels
      .filter((c) => c.workspaceId === workspaceId)
      .map((c) => c.id);

    removeWhere(db.workspaces, (w) => w.id === workspaceId);
    removeWhere(db.memberships, (m) => m.workspaceId === workspaceId);
    removeWhere(db.channelMembers, (cm) => channelIds.includes(cm.channelId));
    removeWhere(db.channels, (c) => c.workspaceId === workspaceId);
    for (const [token, invite] of db.invitations) {
      if (invite.workspaceId === workspaceId) db.invitations.delete(token);
    }
    res.status(204).end();
  },
);

// Members

router.get('/:workspaceId/members', requireMembership, (req, res) => {
  res.json({ members: listMembers(req.workspace.id) });
});

router.patch('/:workspaceId/members/:userId', requireMembership, (req, res) => {
  const { role } = req.body ?? {};
  assertValid({ role: validateMemberRole(role) });

  const actor = req.membership.role;
  const target = getMembership(req.workspace.id, req.params.userId);
  if (!target) throw new ApiError(404, 'NOT_FOUND', 'Member not found.');
  if (target.userId === req.user.id) {
    throw new ApiError(403, 'FORBIDDEN', 'You cannot change your own role.');
  }
  if (target.role === 'owner') {
    throw new ApiError(403, 'FORBIDDEN', 'The owner role cannot be changed.');
  }
  if (!can(actor, 'members:changeRole')) {
    throw new ApiError(403, 'FORBIDDEN', 'Your role does not allow this action.');
  }
  if (role === 'admin' && actor !== 'owner') {
    throw new ApiError(403, 'FORBIDDEN', 'Only the owner can make someone an admin.');
  }
  if (actor === 'admin' && target.role === 'admin') {
    throw new ApiError(403, 'FORBIDDEN', 'Admins cannot change other admins.');
  }

  target.role = role;
  recordAudit({
    workspaceId: req.workspace.id,
    actorId: req.user.id,
    action: 'member.role',
    targetType: 'user',
    targetId: target.userId,
    summary: 'Changed a member role to ' + role,
  });
  res.json({ member: toMemberView(target) });
});

/** Members can leave on their own. Admins can remove members and guests. The owner cannot leave. */
router.delete('/:workspaceId/members/:userId', requireMembership, (req, res) => {
  const target = getMembership(req.workspace.id, req.params.userId);
  if (!target) throw new ApiError(404, 'NOT_FOUND', 'Member not found.');

  const isSelf = target.userId === req.user.id;
  const actor = req.membership.role;

  if (target.role === 'owner') {
    throw new ApiError(403, 'FORBIDDEN', 'The owner cannot leave or be removed.');
  }
  if (!isSelf) {
    if (!can(actor, 'members:remove')) {
      throw new ApiError(403, 'FORBIDDEN', 'Your role does not allow this action.');
    }
    if (actor === 'admin' && target.role === 'admin') {
      throw new ApiError(403, 'FORBIDDEN', 'Admins cannot remove other admins.');
    }
  }

  const channelIds = db.channels
    .filter((c) => c.workspaceId === req.workspace.id)
    .map((c) => c.id);
  recordAudit({
    workspaceId: req.workspace.id,
    actorId: req.user.id,
    action: 'member.remove',
    targetType: 'user',
    targetId: target.userId,
    summary: isSelf ? 'Left the workspace' : 'Removed a member',
  });
  removeWhere(db.memberships, (m) => m === target);
  removeWhere(
    db.channelMembers,
    (cm) => cm.userId === target.userId && channelIds.includes(cm.channelId),
  );
  res.status(204).end();
});

// Invitations (owner and admin)

router.get(
  '/:workspaceId/invitations',
  requireMembership,
  requirePermission('invitations:manage'),
  (req, res) => {
    const invitations = [...db.invitations.entries()]
      .filter(([, invite]) => invite.workspaceId === req.workspace.id)
      .map(([token, invite]) => toInvitationView(token, invite));
    res.json({ invitations });
  },
);

router.post(
  '/:workspaceId/invitations',
  requireMembership,
  requirePermission('invitations:manage'),
  (req, res) => {
    const { role = 'member' } = req.body ?? {};
    assertValid({ role: validateInviteRole(role) });
    if (role === 'admin' && req.membership.role !== 'owner') {
      throw new ApiError(403, 'FORBIDDEN', 'Only the owner can invite admins.');
    }

    const token = randomBytes(24).toString('hex');
    const invite = {
      workspaceId: req.workspace.id,
      role,
      createdBy: req.user.id,
      expiresAt: Date.now() + INVITE_TTL_MS,
    };
    db.invitations.set(token, invite);
    recordAudit({
      workspaceId: req.workspace.id,
      actorId: req.user.id,
      action: 'invitation.create',
      targetType: 'invitation',
      targetId: token,
      summary: 'Created a ' + role + ' invite link',
    });
    res.status(201).json({ invitation: toInvitationView(token, invite) });
  },
);

/** Revoking keeps the link in the list with status "Revoked", so admins can see what happened. */
router.delete(
  '/:workspaceId/invitations/:token',
  requireMembership,
  requirePermission('invitations:manage'),
  (req, res) => {
    const invite = db.invitations.get(req.params.token);
    if (!invite || invite.workspaceId !== req.workspace.id) {
      throw new ApiError(404, 'NOT_FOUND', 'Invitation not found.');
    }
    recordAudit({
      workspaceId: req.workspace.id,
      actorId: req.user.id,
      action: 'invitation.revoke',
      targetType: 'invitation',
      targetId: req.params.token,
      summary: 'Revoked an invite link',
    });
    invite.revokedAt = new Date().toISOString();
    res.status(204).end();
  },
);

export default router;