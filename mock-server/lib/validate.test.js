import { describe, expect, it } from 'vitest';
import { validateAvatarUrl, validateEmail, validatePassword } from './validate.js';

describe('server validation', () => {
  it('requires a letter and a number in passwords', () => {
    expect(validatePassword('abcdefgh')).toBe('Include at least one number.');
    expect(validatePassword('Password1')).toBeNull();
  });

  it('rejects emails without a dot after the @', () => {
    expect(validateEmail('a@b')).not.toBeNull();
    expect(validateEmail('ayesha@example.com')).toBeNull();
  });

  it('accepts an empty avatar URL and only http(s) links', () => {
    expect(validateAvatarUrl('')).toBeNull();
    expect(validateAvatarUrl('https://example.com/a.png')).toBeNull();
    expect(validateAvatarUrl('ftp://example.com/a.png')).not.toBeNull();
  });
});