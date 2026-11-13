import { Router } from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import { db, RESET_TTL_MS } from '../data/store.js';
import { ApiError } from '../lib/apiError.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { toPublicUser } from '../lib/publicUser.js';
import { createSession } from '../lib/session.js';
import {
  assertValid,
  validateDisplayName,
  validateEmail,
  validatePassword,
} from '../lib/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

const normalizeEmail = (email) => email.trim().toLowerCase();
const findByEmail = (email) => db.users.find((user) => user.email === normalizeEmail(email));

router.post('/register', async (req, res) => {
  const { displayName, email, password } = req.body ?? {};
  assertValid({
    displayName: validateDisplayName(displayName),
    email: validateEmail(email),
    password: validatePassword(password),
  });

  if (findByEmail(email)) {
    throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists.', [
      { field: 'email', message: 'This email is already registered.' },
    ]);
  }

  const user = {
    id: randomUUID(),
    email: normalizeEmail(email),
    displayName: displayName.trim(),
    avatarUrl: '',
    statusMessage: '',
    createdAt: new Date().toISOString(),
    passwordHash: await hashPassword(password),
  };
  db.users.push(user);

  res.status(201).json({ user: toPublicUser(user), accessToken: createSession(user.id) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  assertValid({
    email: typeof email === 'string' && email.trim() ? null : 'Email is required.',
    password: typeof password === 'string' && password ? null : 'Password is required.',
  });

  const user = findByEmail(email);
  const valid = Boolean(user) && (await verifyPassword(password, user.passwordHash));
  if (!valid) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  res.json({ user: toPublicUser(user), accessToken: createSession(user.id) });
});

router.post('/logout', requireAuth, (req, res) => {
  db.sessions.delete(req.token);
  res.status(204).end();
});

/**
 * Always answers 202 so the response does not reveal which emails are registered.
 */
router.post('/forgot-password', (req, res) => {
  const { email } = req.body ?? {};
  assertValid({ email: validateEmail(email) });

  const user = findByEmail(email);
  if (user) {
    const resetToken = randomBytes(32).toString('hex');
    db.resetTokens.set(resetToken, { userId: user.id, expiresAt: Date.now() + RESET_TTL_MS });
    // Simulated email delivery: the link is printed to the dev server console only.
    console.log(`[mock email] Reset link for ${user.email}: http://localhost:5173/reset-password?token=${resetToken}`);
  }

  res.status(202).json({ message: 'If an account exists for this email, a reset link has been sent.' });
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body ?? {};
  assertValid({ password: validatePassword(password) });

  const record = typeof token === 'string' ? db.resetTokens.get(token) : undefined;
  if (!record || record.expiresAt < Date.now()) {
    throw new ApiError(400, 'INVALID_RESET_TOKEN', 'This reset link is invalid or has expired. Request a new one.');
  }

  const user = db.users.find((candidate) => candidate.id === record.userId);
  if (!user) {
    throw new ApiError(400, 'INVALID_RESET_TOKEN', 'This reset link is invalid or has expired. Request a new one.');
  }

  user.passwordHash = await hashPassword(password);
  db.resetTokens.delete(token);
  // A password change signs the user out everywhere.
  for (const [sessionToken, session] of db.sessions) {
    if (session.userId === user.id) db.sessions.delete(sessionToken);
  }

  res.status(204).end();
});

export default router;