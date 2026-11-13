import express from 'express';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import workspaceRoutes from './routes/workspaces.js';
import channelRoutes from './routes/channels.js';
import invitationRoutes from './routes/invitations.js';
import conversationRoutes from './routes/conversations.js';
import messageRoutes from './routes/messages.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { loadDb, saveDb } from './lib/persist.js';

/** Builds the mock API. Used by the Vite dev server. */
export function createApp() {
  loadDb();

  const app = express();
  app.use(express.json({ limit: '100kb' }));

  // Save after every change, so accounts and workspaces survive restarts.
  app.use((req, res, next) => {
    if (req.method !== 'GET') res.on('finish', saveDb);
    next();
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/workspaces', channelRoutes);
  app.use('/api/invitations', invitationRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/rooms', messageRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}