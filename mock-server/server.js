import { createApp } from './app.js';
import { seedUsers } from './seed.js';

const PORT = Number(process.env.PORT) || 5050;

const app = createApp();
await seedUsers();

app.listen(PORT, '127.0.0.1', (error) => {
  if (error) {
    console.error(`Could not start on port ${PORT}: ${error.code ?? ''} ${error.message}`);
    process.exit(1);
  }
  console.log(`Mock API running at http://127.0.0.1:${PORT}/api`);
});