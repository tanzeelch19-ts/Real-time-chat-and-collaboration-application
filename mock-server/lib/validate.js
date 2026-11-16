import { ApiError } from './apiError.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AVATAR_DATA_LIMIT = 700 * 1024;

export function validateEmail(value) {
  if (typeof value !== 'string' || !EMAIL_PATTERN.test(value.trim()) || value.trim().length > 254) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validatePassword(value) {
  if (typeof value !== 'string' || value.length < 8) return 'Password must be at least 8 characters.';
  if (value.length > 128) return 'Password must be 128 characters or fewer.';
  if (!/[A-Za-z]/.test(value)) return 'Include at least one letter.';
  if (!/\d/.test(value)) return 'Include at least one number.';
  return null;
}

export function validateDisplayName(value) {
  if (typeof value !== 'string') return 'Name is required.';
  const trimmed = value.trim();
  if (trimmed.length < 2) return 'Name must be at least 2 characters.';
  if (trimmed.length > 40) return 'Name must be 40 characters or fewer.';
  return null;
}

export function validateStatusMessage(value) {
  if (typeof value !== 'string') return 'Status must be text.';
  if (value.trim().length > 80) return 'Status must be 80 characters or fewer.';
  return null;
}

/** Accepts '', an http(s) link, or an image uploaded as a data URL (see the avatar upload route). */
export function validateAvatarUrl(value) {
  if (typeof value !== 'string') return 'Avatar must be a URL.';
  if (value === '') return null;
  if (value.startsWith('data:image/')) {
    return value.length <= AVATAR_DATA_LIMIT ? null : 'Avatar image is too large.';
  }
  if (value.length > 500) return 'URL must be 500 characters or fewer.';
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:' ? null : 'Avatar must be an http or https URL.';
  } catch {
    return 'Enter a valid URL.';
  }
}

/** Throws a 422 listing every failing field. Pass `null` for valid fields. */
export function assertValid(checks) {
  const details = Object.entries(checks).flatMap(([field, message]) => (message ? [{ field, message }] : []));
  if (details.length > 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Please fix the highlighted fields.', details);
  }
}
