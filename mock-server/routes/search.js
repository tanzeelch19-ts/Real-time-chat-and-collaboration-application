import { Router } from 'express';
import { ApiError } from '../lib/apiError.js';
import { searchMessages } from '../lib/searchService.js';
import { requireMembership } from '../lib/workspaceAccess.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

const text = (value) => (typeof value === 'string' ? value : '');
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const dayStart = (value) => (DATE_ONLY.test(value) ? `${value}T00:00:00.000Z` : null);
const dayEnd = (value) => (DATE_ONLY.test(value) ? `${value}T23:59:59.999Z` : null);

/**
 * GET /api/workspaces/:workspaceId/search?q=&senderId=&roomId=&from=YYYY-MM-DD&to=YYYY-MM-DD&attachments=1
 * At least one of q (2+ characters) or another filter is required.
 */
router.get('/:workspaceId/search', requireMembership, (req, res) => {
  const query = text(req.query.q).trim();
  const senderId = text(req.query.senderId) || null;
  const roomId = text(req.query.roomId) || null;
  const from = dayStart(text(req.query.from));
  const to = dayEnd(text(req.query.to));
  const hasAttachments = req.query.attachments === '1';
  const hasFilter = Boolean(senderId || roomId || from || to || hasAttachments);

  if ((query && query.length < 2) || (!query && !hasFilter)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Please fix the highlighted fields.', [
      { field: 'q', message: 'Type at least 2 characters, or choose a filter.' },
    ]);
  }

  const results = searchMessages({
    workspaceId: req.workspace.id,
    userId: req.user.id,
    query,
    roomId,
    senderId,
    from,
    to,
    hasAttachments,
    limit: 30,
  });
  res.json({ results });
});

export default router;