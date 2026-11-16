import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies the right password only', async () => {
    const stored = await hashPassword('Password123!');
    expect(stored).not.toContain('Password123!');
    expect(await verifyPassword('Password123!', stored)).toBe(true);
    expect(await verifyPassword('Password124!', stored)).toBe(false);
  });

  it('salts every hash, so the same password is stored differently each time', async () => {
    const first = await hashPassword('Password123!');
    const second = await hashPassword('Password123!');
    expect(first).not.toBe(second);
  });
});
