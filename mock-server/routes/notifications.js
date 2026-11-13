import { Router } from 'express';
import { ApiError } from '../lib/apiError.js';
import {
  listNotifications,
  markAllRead,
  markNotificationRead,
  markRoomRead,
  notificationSummary,
} from '../lib/notificationService.js';
import { markRoomReadAt } from '../lib/channelExtras.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

/** GET /api/notifications?unread=1&limit=50 */
router.get('/', (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  res.json(listNotifications(req.user.id, { unreadOnly: req.query.unread === '1', limit }));
});

/** Unread total and unread counts per room, for sidebar badges. */
router.get('/summary', (req, res) => {
  res.json(notificationSummary(req.user.id));
});

router.post('/read-all', (req, res) => {
  const workspaceId = typeof req.body?.workspaceId === 'string' ? req.body.workspaceId : null;
  markAllRead(req.user.id, workspaceId);
  res.status(204).end();
});

/** Clears every unread notification for one room (opening a channel or DM counts as reading it). */
router.post('/read-room', (req, res) => {
  const roomId = req.body?.roomId;
  if (typeof roomId !== 'string' || !roomId) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Please fix the highlighted fields.', [
      { field: 'roomId', message: 'Room is required.' },
    ]);
  }
  markRoomRead(req.user.id, roomId);
  markRoomReadAt(roomId, req.user.id);
  markRoomReadAt(roomId, req.user.id);
  res.status(204).end();
});

router.post('/:notificationId/read', (req, res) => {
  const notification = markNotificationRead(req.user.id, req.params.notificationId);
  if (!notification) throw new ApiError(404, 'NOT_FOUND', 'Notification not found.');
  res.json({ notification });
});

export default router;
