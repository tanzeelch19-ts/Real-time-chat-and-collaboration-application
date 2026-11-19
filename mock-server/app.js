import express from 'express';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import workspaceRoutes from './routes/workspaces.js';
import channelRoutes from './routes/channels.js';
import invitationRoutes from './routes/invitations.js';
import conversationRoutes from './routes/conversations.js';
import messageRoutes from './routes/messages.js';
import attachmentUploadRoutes, { downloadRouter as attachmentDownloadRoutes } from './routes/attachments.js';
import searchRoutes from './routes/search.js';
import notificationRoutes from './routes/notifications.js';
import pinRoutes, { savedRouter } from './routes/pins.js';
import meetingRoomRoutes, { meetingDetailRouter } from './routes/meetings.js';
import auditRoutes from './routes/audit.js';
import roomSettingsRoutes from './routes/roomSettings.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { loadDb, saveDb } from './lib/persist.js';
import {
  securityHeaders,
  authRateLimit,
  requestLogger,
  cspReportRateLimit,
  summarizeCspReport,
} from './lib/security.js';

/** Builds the mock API. Used by the Vite dev server. */
export function createApp() {
  loadDb();

  const app = express();
  // Behind Railway's proxy, req.ip must come from X-Forwarded-For. Otherwise every user shares one rate-limit bucket.
  app.set('trust proxy', 1);

  // Cross-origin access for a frontend hosted elsewhere (for example Vercel).
  // Only origins listed in CORS_ORIGIN (comma-separated) are allowed. When it is empty,
  // only same-origin requests work, which is the case for the single-server deployment.
  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-File-Name, X-Caption');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.disable('x-powered-by');
  // Live data must never be served from a cache. Without this, the browser can answer a
  // conditional request with 304 and show an old copy, so new messages do not appear.
  app.set('etag', false);
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(express.json({ limit: '100kb' }));

  // Save after every change, so accounts, workspaces, and messages survive restarts.
  app.use((req, res, next) => {
    if (req.method !== 'GET') res.on('finish', saveDb);
    next();
  });

  // Browsers send CSP violation reports here. Only three fields are logged, and requests are rate-limited.
  app.post(
    '/api/csp-report',
    cspReportRateLimit,
    express.json({
      type: ['application/csp-report', 'application/reports+json', 'application/json'],
      limit: '16kb',
    }),
    (req, res) => {
      const items = Array.isArray(req.body) ? req.body.slice(0, 10) : [req.body];
      for (const item of items) {
        console.log(
          JSON.stringify({ time: new Date().toISOString(), cspViolation: summarizeCspReport(item) }),
        );
      }
      res.status(204).end();
    },
  );

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth/login', authRateLimit);
  app.use('/api/auth/register', authRateLimit);
  app.use('/api/auth/forgot-password', authRateLimit);
  app.use('/api/auth/reset-password', authRateLimit);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/workspaces', channelRoutes);
  app.use('/api/workspaces', searchRoutes);
  app.use('/api/workspaces', auditRoutes);
  app.use('/api/invitations', invitationRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/rooms', messageRoutes);
  app.use('/api/rooms', attachmentUploadRoutes);
  app.use('/api/rooms', pinRoutes);
  app.use('/api/rooms', meetingRoomRoutes);
  app.use('/api/rooms', roomSettingsRoutes);
  app.use('/api/attachments', attachmentDownloadRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/saved', savedRouter);
  app.use('/api/meetings', meetingDetailRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
