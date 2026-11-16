import { Router } from 'express';
import { ApiError } from '../lib/apiError.js';
import {
  deleteMessage,
  editMessage,
  listRoomMessages,
  sendMessage,
  toggleReaction,
} from '../lib/messageActions.js';
import { emitToRoom } from '../realtime/hub.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

/** Turns a failed action into an ApiError. Successful results pass through. */
function unwrap(result) {
  if (!result.ok) throw new ApiError(result.status, result.code, result.message, result.details);
  return result;
}

/** Pushes changed message views to everyone subscribed to the room. */
function publish(roomId, views) {
  for (const view of views) emitToRoom(roomId, 'message:updated', view);
}

/** GET /api/rooms/:roomId/messages?before=<id>&limit=30&threadId=<id> */
router.get('/:roomId/messages', (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const before = typeof req.query.before === 'string' ? req.query.before : undefined;
  const threadId = typeof req.query.threadId === 'string' && req.query.threadId ? req.query.threadId : null;

  const { page } = unwrap(
    listRoomMessages({ roomId: req.params.roomId, userId: req.user.id, before, limit, threadId }),
  );
  res.json(page);
});

router.post('/:roomId/messages', (req, res) => {
  const { body, threadId } = req.body ?? {};
  const result = unwrap(
    sendMessage({
      roomId: req.params.roomId,
      userId: req.user.id,
      body,
      threadId: threadId ?? null,
    }),
  );
  emitToRoom(req.params.roomId, 'message:new', result.message);
  publish(req.params.roomId, result.changed);
  res.status(201).json({ message: result.message });
});

router.patch('/:roomId/messages/:messageId', (req, res) => {
  const { body } = req.body ?? {};
  const result = unwrap(
    editMessage({
      roomId: req.params.roomId,
      userId: req.user.id,
      messageId: req.params.messageId,
      body,
    }),
  );
  publish(req.params.roomId, result.changed);
  res.json({ message: result.message });
});

router.delete('/:roomId/messages/:messageId', (req, res) => {
  const result = unwrap(
    deleteMessage({
      roomId: req.params.roomId,
      userId: req.user.id,
      messageId: req.params.messageId,
    }),
  );
  publish(req.params.roomId, result.changed);
  res.json({ message: result.message });
});

router.post('/:roomId/messages/:messageId/reactions', (req, res) => {
  const { emoji } = req.body ?? {};
  const result = unwrap(
    toggleReaction({
      roomId: req.params.roomId,
      userId: req.user.id,
      messageId: req.params.messageId,
      emoji,
    }),
  );
  publish(req.params.roomId, result.changed);
  res.json({ message: result.message });
});

export default router;
