import { Router } from 'express';
import { preferencesOf } from '../lib/notificationService.js';
import { toPublicUser } from '../lib/publicUser.js';
import {
  assertValid,
  validateAvatarUrl,
  validateDisplayName,
  validateStatusMessage,
} from '../lib/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

router.get('/me', (req, res) => {
  res.json({ user: toPublicUser(req.user) });
});

router.patch('/me', (req, res) => {
  const body = req.body ?? {};
  const checks = {};
  if (body.displayName !== undefined) checks.displayName = validateDisplayName(body.displayName);
  if (body.statusMessage !== undefined) checks.statusMessage = validateStatusMessage(body.statusMessage);
  if (body.avatarUrl !== undefined) checks.avatarUrl = validateAvatarUrl(body.avatarUrl);
  assertValid(checks);

  if (body.displayName !== undefined) req.user.displayName = body.displayName.trim();
  if (body.statusMessage !== undefined) req.user.statusMessage = body.statusMessage.trim();
  if (body.avatarUrl !== undefined) req.user.avatarUrl = body.avatarUrl.trim();

  res.json({ user: toPublicUser(req.user) });
});

const PREF_KEYS = ['mentions', 'replies', 'direct'];

router.get('/me/notifications', (req, res) => {
  res.json({ preferences: preferencesOf(req.user) });
});

router.patch('/me/notifications', (req, res) => {
  const body = req.body ?? {};
  const checks = {};
  for (const key of PREF_KEYS) {
    if (body[key] !== undefined && typeof body[key] !== 'boolean') {
      checks[key] = `${key} must be true or false.`;
    }
  }
  assertValid(checks);

  const next = { ...preferencesOf(req.user) };
  for (const key of PREF_KEYS) {
    if (typeof body[key] === 'boolean') next[key] = body[key];
  }
  req.user.notificationPrefs = next;
  res.json({ preferences: next });
});

export default router;