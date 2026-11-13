import { Router } from 'express';
import { ApiError } from '../lib/apiError.js';
import { isMuted, setMuted } from '../lib/roomSettings.js';
import { resolveRoomAccess } from '../lib/rooms.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

/** PUT /api/rooms/:roomId/mute  body: { muted: true | false } */
router.put('/:roomId/mute', (req, res) => {
  if (!resolveRoomAccess(req.params.roomId, req.user.id)) {
    throw new ApiError(404, 'NOT_FOUND', 'Conversation not found.');
  }
  const muted = req.body?.muted;
  if (typeof muted !== 'boolean') {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Please fix the highlighted fields.', [
      { field: 'muted', message: 'muted must be true or false.' },
    ]);
  }
  setMuted(req.user.id, req.params.roomId, muted);
  res.json({ muted: isMuted(req.user.id, req.params.roomId) });
});

export default router;