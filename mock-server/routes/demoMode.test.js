import { afterEach, describe, expect, it } from 'vitest';
import { denyInDemo } from './workspaces.js';

/** Runs one middleware and returns the error it passes to next(), or undefined. */
const run = (middleware, req) => new Promise((resolve) => middleware(req, {}, (err) => resolve(err)));

afterEach(() => {
  delete process.env.DEMO_MODE;
});

describe('DEMO_MODE guard', () => {
  it('blocks the seeded demo workspace when DEMO_MODE=true', async () => {
    process.env.DEMO_MODE = 'true';
    const err = await run(denyInDemo('blocked'), { workspace: { isDemo: true } });
    expect(err.status).toBe(403);
    expect(err.message).toBe('blocked');
  });

  it('does not block a workspace a user created, even when DEMO_MODE=true', async () => {
    process.env.DEMO_MODE = 'true';
    const err = await run(denyInDemo('blocked'), { workspace: { isDemo: false } });
    expect(err).toBeUndefined();
  });

  it('does nothing when DEMO_MODE is not set', async () => {
    const err = await run(denyInDemo('blocked'), { workspace: { isDemo: true } });
    expect(err).toBeUndefined();
  });
});
