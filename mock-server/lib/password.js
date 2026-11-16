import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

/** Passwords are never stored in plain text. */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [salt, hashHex] = stored.split(':');
  const expected = Buffer.from(hashHex, 'hex');
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
