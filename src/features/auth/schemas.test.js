import { describe, expect, it } from 'vitest';
import { profileSchema, registerSchema, resetPasswordSchema } from '@/features/auth/schemas';

describe('auth schemas', () => {
  it('requires a letter and a number in passwords', () => {
    const result = registerSchema.safeParse({
      displayName: 'Ayesha',
      email: 'ayesha@example.com',
      password: 'abcdefgh',
    });

    expect(result.success).toBe(false);
    expect(result.error.issues.map((issue) => issue.message)).toContain('Include at least one number');
  });

  it('flags mismatched passwords on the confirm field', () => {
    const result = resetPasswordSchema.safeParse({ password: 'Password1', confirmPassword: 'Password2' });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(['confirmPassword']);
  });

  it('accepts an empty avatar URL and rejects non-http URLs', () => {
    const base = { displayName: 'Ayesha', statusMessage: '' };

    expect(profileSchema.safeParse({ ...base, avatarUrl: '' }).success).toBe(true);
    expect(profileSchema.safeParse({ ...base, avatarUrl: 'ftp://example.com/a.png' }).success).toBe(false);
  });
});
