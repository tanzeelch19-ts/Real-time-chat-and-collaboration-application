import { describe, expect, it } from 'vitest';
import { invitationStatus } from './invitationStatus.js';

const NOW = Date.parse('2026-06-01T00:00:00Z');
const FUTURE = NOW + 86400000;
const PAST = NOW - 1;

describe('invitationStatus', () => {
  it('is pending when it is valid and unused', () => {
    expect(invitationStatus({ expiresAt: FUTURE }, NOW)).toBe('pending');
  });

  it('is accepted once it has been used', () => {
    expect(invitationStatus({ expiresAt: FUTURE, acceptCount: 2 }, NOW)).toBe('accepted');
  });

  it('is expired after its expiry time', () => {
    expect(invitationStatus({ expiresAt: PAST }, NOW)).toBe('expired');
  });

  it('is revoked even when it has also expired', () => {
    expect(invitationStatus({ expiresAt: PAST, revokedAt: '2026-05-01T00:00:00Z' }, NOW)).toBe('revoked');
  });
});