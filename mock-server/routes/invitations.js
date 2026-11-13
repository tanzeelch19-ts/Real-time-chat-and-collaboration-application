import { Router } from 'express';
import { db } from '../data/store.js';
import { ApiError } from '../lib/apiError.js';
import { createNotification } from '../lib/notificationService.js';
import { addMembership, getMembership, toWorkspaceView } from '../lib/workspaceService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

function findActiveInvitation(token) {
  const invite = db.invitations.get(token);
  const workspace = invite ? db.workspaces.find((w) => w.id === invite.workspaceId) : null;
  if (!invite || !workspace || invite.revokedAt || invite.expiresAt < Date.now()) {
    throw new ApiError(404, 'INVITATION_INVALID', 'This invitation is invalid or has expired.');
  }
  return { invite, workspace };
}

/** Preview shown before the user accepts. */
router.get('/:token', (req, res) => {
  const { invite, workspace } = findActiveInvitation(req.params.token);
  const alreadyMember = Boolean(getMembership(workspace.id, req.user.id));
  res.json({
    invitation: {
      workspace: { id: workspace.id, name: workspace.name },
      role: invite.role,
      alreadyMember,
    },
  });
});

/** Joins the workspace. Accepting twice is safe. The inviter gets a notification the first time. */
router.post('/:token/accept', (req, res) => {
  const { invite, workspace } = findActiveInvitation(req.params.token);
  const existing = getMembership(workspace.id, req.user.id);
  if (existing) {
    return res.json({ workspace: toWorkspaceView(workspace, existing.role), joined: false });
  }

  addMembership(workspace.id, req.user.id, invite.role);
  invite.acceptCount = (invite.acceptCount ?? 0) + 1;
  createNotification({
    userId: invite.createdBy,
    kind: 'invitation',
    workspaceId: workspace.id,
    roomId: null,
    actorId: req.user.id,
    preview: workspace.name,
  });
  return res.status(201).json({ workspace: toWorkspaceView(workspace, invite.role), joined: true });
});

export default router;