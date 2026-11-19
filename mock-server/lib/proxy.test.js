// @vitest-environment node
import http from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';

// Keep the test away from the real demo data file.
vi.mock('./persist.js', () => ({ loadDb: () => false, saveDb: () => {} }));

afterEach(() => {
  delete process.env.TRUST_PROXY;
});

/** Sends wrong-password logins and returns how many were answered with 429. */
async function bruteForce(app, headerFor) {
  const server = http.createServer(app).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/auth/login`;
  let limited = 0;
  for (let i = 0; i < 35; i += 1) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headerFor(i) },
      body: JSON.stringify({ email: 'nobody@demo.test', password: 'wrong-pass-1' }),
    });
    if (res.status === 429) limited += 1;
  }
  server.close();
  return limited;
}

describe('rate limits and X-Forwarded-For', () => {
  it('without TRUST_PROXY, a fake X-Forwarded-For cannot reset the login limit', async () => {
    const app = createApp();
    const limited = await bruteForce(app, (i) => ({ 'X-Forwarded-For': `10.0.${i}.1` }));
    expect(limited).toBeGreaterThan(0);
  });

  it.each(['0', 'false', 'true', 'abc'])(
    'with TRUST_PROXY=%s, a fake X-Forwarded-For still cannot reset the login limit',
    async (value) => {
      process.env.TRUST_PROXY = value;
      const app = createApp();
      const limited = await bruteForce(app, (i) => ({ 'X-Forwarded-For': `10.8.${i}.1` }));
      expect(limited).toBeGreaterThan(0);
    },
  );

  it('with TRUST_PROXY=1, each forwarded client gets its own bucket', async () => {
    process.env.TRUST_PROXY = '1';
    const app = createApp();
    const limited = await bruteForce(app, (i) => ({ 'X-Forwarded-For': `10.9.${i}.1` }));
    expect(limited).toBe(0);
  });
});
