import { db } from '../data/store.js';
import { ApiError } from '../lib/apiError.js';
import { getSession } from '../lib/session.js';

/** Attaches req.user and req.token when the Bearer token is valid and unexpired. */
export function requireAuth(req, _res, next) {
  const header = req.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = token ? getSession(token) : null;

  if (!session) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Your session has expired. Please sign in again.'));
  }

  const user = db.users.find((candidate) => candidate.id === session.userId);
  if (!user) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Account not found. Please sign in again.'));
  }

  req.user = user;
  req.token = token;
  return next();
}
