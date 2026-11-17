import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createApp } from './mock-server/app.js';
import { seedUsers } from './mock-server/seed.js';
import { attachRealtime } from './mock-server/socket/index.js';

/**
 * Serves the mock REST API and Socket.IO from inside the Vite dev server.
 * The browser talks only to localhost:5173.
 */
function mockApi() {
  return {
    name: 'mock-api',
    apply: 'serve',
    async configureServer(server) {
      const app = createApp();
      await seedUsers();
      if (server.httpServer) attachRealtime(server.httpServer);

      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api')) return app(req, res, next);
        return next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), mockApi()],
  build: {
    rolldownOptions: {
      output: {
        // Vendor libraries are saved as separate files, so the app code is smaller and caches better.
        manualChunks(id) {
          const path = id.replace(/\\/g, '/');
          if (!path.includes('/node_modules/')) return undefined;
          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(path))
            return 'react';
          if (/\/node_modules\/(@reduxjs|react-redux|redux|immer|reselect)\//.test(path)) return 'state';
          if (/\/node_modules\/(@tanstack|axios)\//.test(path)) return 'data';
          if (/\/node_modules\/(socket\.io-client|engine\.io-client|socket\.io-parser)\//.test(path))
            return 'realtime';
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
    // Browser tests run with Playwright (npm run test:e2e), not with Vitest.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
});
