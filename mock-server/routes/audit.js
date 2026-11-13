import { Router } from 'express';
import { ApiError } from '../lib/apiError.js';
import { listAudit } from '../lib/auditService.js';
import { isAdminOrAbove } from '../lib/permissions.js';
import { requireMembership } from '../lib/workspaceAccess.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

/** GET /api/workspaces/:workspaceId/audit. Owners and admins only. */
router.get('/:workspaceId/audit', requireMembership, (req, res) => {
  if (!isAdminOrAbove(req.membership.role)) {
    throw new ApiError(403, 'FORBIDDEN', 'Only owners and admins can view the audit log.');
  }
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
  res.json({ entries: listAudit(req.workspace.id, limit) });
});

export default router;