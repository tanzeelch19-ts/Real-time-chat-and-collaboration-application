import { createServer } from 'node:http';
import { createApp } from './app.js';
import { attachRealtime } from './socket/index.js';
import { seedUsers } from './seed.js';

const PORT = Number(process.env.PORT) || 5050;
// Hosting platforms (Render, Railway, Fly.io) need HOST=0.0.0.0.
// Local runs keep 127.0.0.1 unless HOST is set.
const HOST = process.env.HOST || '127.0.0.1';

const app = createApp();
await seedUsers();

const server = createServer(app);
attachRealtime(server);

server.once('error', (error) => {
  console.error(`Could not start on ${HOST}:${PORT}: ${error.code ?? ''} ${error.message}`);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Mock API and Socket.IO running at http://${HOST}:${PORT}`);
});