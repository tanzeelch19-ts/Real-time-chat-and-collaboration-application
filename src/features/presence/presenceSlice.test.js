import { describe, expect, it } from 'vitest';
import reducer, { presenceChanged, presenceSnapshot, selectPresenceStatus } from '@/features/presence/presenceSlice';

const statusOf = (state, userId) => selectPresenceStatus(userId)({ presence: state });

describe('presence slice', () => {
  it('moves a user from online to away to offline', () => {
    let state = reducer(undefined, presenceChanged({ userId: 'u1', online: true, away: false }));
    expect(statusOf(state, 'u1')).toBe('online');

    state = reducer(state, presenceChanged({ userId: 'u1', online: true, away: true }));
    expect(statusOf(state, 'u1')).toBe('away');

    state = reducer(state, presenceChanged({ userId: 'u1', online: false }));
    expect(statusOf(state, 'u1')).toBe('offline');
  });

  it('loads both lists from a snapshot', () => {
    const state = reducer(
      undefined,
      presenceSnapshot({ userIds: ['u1', 'u2'], awayIds: ['u2'] }),
    );
    expect(statusOf(state, 'u1')).toBe('online');
    expect(statusOf(state, 'u2')).toBe('away');
  });
});