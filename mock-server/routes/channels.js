import { Router } from 'express';
import { db, removeWhere } from '../data/store.js';
import { ApiError } from '../lib/apiError.js';
import { unreadCountFor, updateChannelDetails } from '../lib/channelExtras.js';
import { createNotification } from '../lib/notificationService.js';
import { isAdminOrAbove } from '../lib/permissions.js';
import { isMuted } from '../lib/roomSettings.js';
import { assertValid } from '../lib/validate.js';
import { validateChannelName, validateUserId, validateVisibility } from '../lib/validateWorkspace.js';
import { requireMembership, requirePermission } from '../lib/workspaceAccess.js';
import {
  addChannelMember,
  canSeeChannel,
  createChannel,
  getMembership,
  toChannelView,
} from '../lib/workspaceService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

/** Returns the channel, or 404 if it is missing or hidden from this user. */
function findVisibleChannel(req) {
  const channel = db.channels.find(
    (c) => c.id === req.params.channelId && c.workspaceId === req.workspace.id,
  );
  if (!channel || !canSeeChannel(channel, req.membership.role, req.user.id)) {
    throw new ApiError(404, 'NOT_FOUND', 'Channel not found.');
  }
  return channel;
}

function canManageChannel(channel, role, userId) {
  return channel.createdBy === userId || isAdminOrAbove(role);
}

function toChannelMemberView(channel, entry) {
  const user = db.users.find((u) => u.id === entry.userId);
  const membership = getMembership(channel.workspaceId, entry.userId);
  return {
    userId: entry.userId,
    displayName: user?.displayName ?? 'Unknown user',
    avatarUrl: user?.avatarUrl ?? '',
    role: membership?.role ?? 'member',
  };
}

router.get('/:workspaceId/channels', requireMembership, (req, res) => {
  const channels = db.channels
    .filter((c) => c.workspaceId === req.workspace.id)
    .filter((c) => canSeeChannel(c, req.membership.role, req.user.id))
    .map((c) => ({
      ...toChannelView(c),
      unreadCount: unreadCountFor(`channel:${c.id}`, req.user.id),
      muted: isMuted(req.user.id, `channel:${c.id}`),
    }));
  res.json({ channels });
});

router.post('/:workspaceId/channels', requireMembership, requirePermission('channels:create'), (req, res) => {
  const { name, visibility = 'public' } = req.body ?? {};
  assertValid({
    name: validateChannelName(name),
    visibility: validateVisibility(visibility),
  });

  const normalized = name.trim().toLowerCase();
  const duplicate = db.channels.some((c) => c.workspaceId === req.workspace.id && c.name === normalized);
  if (duplicate) {
    throw new ApiError(409, 'CONFLICT', 'A channel with this name already exists.', [
      { field: 'name', message: 'A channel with this name already exists.' },
    ]);
  }

  const channel = createChannel({
    workspaceId: req.workspace.id,
    name: normalized,
    visibility,
    creatorId: req.user.id,
  });
  if (visibility === 'private') addChannelMember(channel.id, req.user.id);

  res.status(201).json({ channel: toChannelView(channel) });
});

router.get('/:workspaceId/channels/:channelId', requireMembership, (req, res) => {
  res.json({ channel: toChannelView(findVisibleChannel(req)) });
});

router.get('/:workspaceId/channels/:channelId/members', requireMembership, (req, res) => {
  const channel = findVisibleChannel(req);
  const members = db.channelMembers
    .filter((cm) => cm.channelId === channel.id)
    .map((cm) => toChannelMemberView(channel, cm));
  res.json({ members });
});

/** A manager (creator, owner, or admin) adds a workspace member. The added person is notified. */
router.post('/:workspaceId/channels/:channelId/members', requireMembership, (req, res) => {
  const channel = findVisibleChannel(req);
  const { userId } = req.body ?? {};
  assertValid({ userId: validateUserId(userId) });

  if (!canManageChannel(channel, req.membership.role, req.user.id)) {
    throw new ApiError(403, 'FORBIDDEN', 'Only the channel creator or an admin can add members.');
  }

  const target = getMembership(req.workspace.id, userId);
  if (!target) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Please fix the highlighted fields.', [
      { field: 'userId', message: 'This user is not a member of the workspace.' },
    ]);
  }

  addChannelMember(channel.id, userId);
  createNotification({
    userId,
    kind: 'channel',
    workspaceId: req.workspace.id,
    roomId: `channel:${channel.id}`,
    actorId: req.user.id,
    preview: `#${channel.name}`,
  });
  res.status(201).json({ channelId: channel.id, userId, added: true });
});

router.post('/:workspaceId/channels/:channelId/join', requireMembership, (req, res) => {
  const channel = findVisibleChannel(req);
  if (channel.visibility !== 'public') {
    throw new ApiError(403, 'FORBIDDEN', 'Private channels can only be joined by a member who adds you.');
  }
  if (req.membership.role === 'guest') {
    throw new ApiError(403, 'FORBIDDEN', 'Guests cannot join public channels. Ask an admin to add you.');
  }
  addChannelMember(channel.id, req.user.id);
  res.status(201).json({ joined: true });
});

router.delete('/:workspaceId/channels/:channelId/members/:userId', requireMembership, (req, res) => {
  const channel = findVisibleChannel(req);
  const isSelf = req.params.userId === req.user.id;
  if (!isSelf && !canManageChannel(channel, req.membership.role, req.user.id)) {
    throw new ApiError(403, 'FORBIDDEN', 'Only the channel creator or an admin can remove members.');
  }
  removeWhere(db.channelMembers, (cm) => cm.channelId === channel.id && cm.userId === req.params.userId);
  res.status(204).end();
});

router.patch('/:workspaceId/channels/:channelId', requireMembership, (req, res) => {
  const channel = findVisibleChannel(req);
  if (!canManageChannel(channel, req.membership.role, req.user.id)) {
    throw new ApiError(403, 'FORBIDDEN', 'Only the channel creator or an admin can change this channel.');
  }

  const body = req.body ?? {};
  assertValid({
    topic:
      body.topic === undefined || (typeof body.topic === 'string' && body.topic.trim().length <= 120)
        ? null
        : 'Topic must be 120 characters or fewer.',
    description:
      body.description === undefined ||
      (typeof body.description === 'string' && body.description.trim().length <= 500)
        ? null
        : 'Description must be 500 characters or fewer.',
    archived:
      body.archived === undefined || typeof body.archived === 'boolean'
        ? null
        : 'Archived must be true or false.',
  });

  updateChannelDetails(channel, {
    topic: typeof body.topic === 'string' ? body.topic.trim() : undefined,
    description: typeof body.description === 'string' ? body.description.trim() : undefined,
    archived: body.archived,
  });
  res.json({ channel: toChannelView(channel) });
});

export default router;
