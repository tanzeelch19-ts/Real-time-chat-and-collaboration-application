import http from 'node:http';
import { createApp } from './app.js';
import { seedUsers } from './seed.js';
import { attachRealtime } from './socket/index.js';

/** Standalone server for hosting (Render, Railway). Serves REST and Socket.IO on one port. */
const PORT = Number(process.env.PORT) || 4000;

const app = createApp();
const server = http.createServer(app);
attachRealtime(server);
await seedUsers();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock API and realtime running on port ${PORT}`);
});