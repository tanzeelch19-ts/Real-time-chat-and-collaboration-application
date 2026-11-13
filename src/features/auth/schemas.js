import { z } from 'zod';

/** Accepts an empty string (meaning "no avatar") or an http(s) URL. */
const isOptionalHttpUrl = (value) => {
  if (value === '') return true;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

const displayName = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(40, 'Name must be 40 characters or fewer');

const email = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .max(254, 'Email is too long');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be 128 characters or fewer')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  displayName,
  email,
  password,
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  displayName,
  statusMessage: z.string().trim().max(80, 'Status must be 80 characters or fewer'),
  avatarUrl: z
    .string()
    .trim()
    .max(500, 'URL must be 500 characters or fewer')
    .refine(isOptionalHttpUrl, 'Enter a valid http or https URL'),
});