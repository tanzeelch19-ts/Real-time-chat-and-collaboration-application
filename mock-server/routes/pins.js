import { Router } from 'express';
import { db } from '../data/store.js';
import { ApiError } from '../lib/apiError.js';
import { recordAudit } from '../lib/auditService.js';
import { findMessage, toMessageView } from '../lib/messageService.js';
import { isAdminOrAbove } from '../lib/permissions.js';
import { resolveRoomAccess } from '../lib/rooms.js';
import { getMembership } from '../lib/workspaceService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

const notFound = (message) => new ApiError(404, 'NOT_FOUND', message);

function requireRoom(req) {
  const access = resolveRoomAccess(req.params.roomId, req.user.id);
  if (!access) throw notFound('Conversation not found.');
  return access;
}

/** GET /api/rooms/:roomId/pins */
router.get('/:roomId/pins', (req, res) => {
  requireRoom(req);
  const messages = db.pins
    .filter((p) => p.roomId === req.params.roomId)
    .sort((a, b) => b.pinnedAt.localeCompare(a.pinnedAt))
    .map((p) => findMessage(req.params.roomId, p.messageId))
    .filter((m) => m && !m.deletedAt)
    .map((m) => ({ ...toMessageView(m), pinned: true }));
  res.json({ messages });
});

/** Toggles the pin. Any room member can pin. Only the pinner or an admin can unpin. */
router.post('/:roomId/messages/:messageId/pin', (req, res) => {
  const access = requireRoom(req);
  const message = findMessage(req.params.roomId, req.params.messageId);
  if (!message || message.deletedAt) throw notFound('Message not found.');

  const index = db.pins.findIndex((p) => p.roomId === req.params.roomId && p.messageId === message.id);
  let pinned;
  if (index >= 0) {
    const role = getMembership(access.workspaceId, req.user.id)?.role;
    if (db.pins[index].pinnedBy !== req.user.id && !isAdminOrAbove(role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Only the person who pinned this, or an admin, can unpin it.');
    }
    db.pins.splice(index, 1);
    pinned = false;
  } else {
    db.pins.push({
      roomId: req.params.roomId,
      messageId: message.id,
      pinnedBy: req.user.id,
      pinnedAt: new Date().toISOString(),
    });
    pinned = true;
  }

  if (access.kind === 'channel') {
    recordAudit({
      workspaceId: access.workspaceId,
      actorId: req.user.id,
      action: pinned ? 'message.pin' : 'message.unpin',
      targetType: 'message',
      targetId: message.id,
      summary: pinned ? 'Pinned a channel message' : 'Unpinned a channel message',
    });
  }
  res.json({ pinned });
});

/** Toggles the save for this user only. Other people never see it. */
router.post('/:roomId/messages/:messageId/save', (req, res) => {
  requireRoom(req);
  const message = findMessage(req.params.roomId, req.params.messageId);
  if (!message || message.deletedAt) throw notFound('Message not found.');

  const index = db.savedMessages.findIndex((s) => s.userId === req.user.id && s.messageId === message.id);
  let saved;
  if (index >= 0) {
    db.savedMessages.splice(index, 1);
    saved = false;
  } else {
    db.savedMessages.push({
      userId: req.user.id,
      roomId: req.params.roomId,
      messageId: message.id,
      savedAt: new Date().toISOString(),
    });
    saved = true;
  }
  res.json({ saved });
});

/** Mounted at /api/saved. Only messages in rooms the user can still read. */
export const savedRouter = Router();
savedRouter.use(requireAuth);

savedRouter.get('/', (req, res) => {
  const messages = db.savedMessages
    .filter((s) => s.userId === req.user.id)
    .filter((s) => resolveRoomAccess(s.roomId, req.user.id))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .map((s) => findMessage(s.roomId, s.messageId))
    .filter((m) => m && !m.deletedAt)
    .map((m) => ({ ...toMessageView(m), saved: true }));
  res.json({ messages });
});

export default router;
