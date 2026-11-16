import { db } from '../data/store.js';
import { ApiError } from './apiError.js';
import { can } from './permissions.js';
import { getMembership } from './workspaceService.js';

/**
 * Loads the workspace and the caller's membership into req.workspace and req.membership.
 * Non-members get 404 instead of 403, so workspace IDs cannot be probed.
 */
export function requireMembership(req, _res, next) {
  const workspace = db.workspaces.find((w) => w.id === req.params.workspaceId);
  const membership = workspace ? getMembership(workspace.id, req.user.id) : null;
  if (!workspace || !membership) {
    return next(new ApiError(404, 'NOT_FOUND', 'Workspace not found.'));
  }
  req.workspace = workspace;
  req.membership = membership;
  return next();
}

/** Must run after requireMembership. */
export function requirePermission(action) {
  return (req, _res, next) => {
    if (can(req.membership.role, action)) return next();
    return next(new ApiError(403, 'FORBIDDEN', 'Your role does not allow this action.'));
  };
}
