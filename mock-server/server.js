import http from 'node:http';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.js';
import { seedUsers } from './seed.js';
import { attachRealtime } from './socket/index.js';
import { securityHeaders } from './lib/security.js';

const PORT = Number(process.env.PORT) || 4000;
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const api = createApp();

const web = express();
web.use(securityHeaders);
if (existsSync(DIST)) {
  // index: false, so the root page is answered by the app shell below and gets the no-cache header.
  web.use(express.static(DIST, { index: false }));
  // Client-side routes (/login, /w/...) return the app shell.
  web.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(join(DIST, 'index.html'));
  });
}
web.use((_req, res) => res.status(404).send('Not found'));

const server = http.createServer((req, res) => {
  if (req.url?.startsWith('/api')) return api(req, res);
  return web(req, res);
});
attachRealtime(server);
await seedUsers();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Chat app running on port ${PORT}`);
  console.log('Demo accounts: owner@, admin@, member@, guest@ (all @demo.test), password Password123!');
});
