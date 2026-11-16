import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../data/store.js';
import { notifyForMessage } from './notificationService.js';
import { isMuted, setMuted } from './roomSettings.js';

const ROOM = 'channel:c1';

describe('muting a room', () => {
  beforeEach(() => {
    const now = new Date().toISOString();
    db.users = [
      {
        id: 'u1',
        displayName: 'Ayesha Owner',
        email: 'a@t.local',
        avatarUrl: '',
        statusMessage: '',
        passwordHash: 'x',
        createdAt: now,
      },
      {
        id: 'u2',
        displayName: 'Hira Member',
        email: 'h@t.local',
        avatarUrl: '',
        statusMessage: '',
        passwordHash: 'x',
        createdAt: now,
      },
    ];
    db.workspaces = [{ id: 'w1', name: 'Test', createdBy: 'u1', createdAt: now }];
    db.memberships = [
      { workspaceId: 'w1', userId: 'u1', role: 'owner', joinedAt: now },
      { workspaceId: 'w1', userId: 'u2', role: 'member', joinedAt: now },
    ];
    db.channels = [
      {
        id: 'c1',
        workspaceId: 'w1',
        name: 'general',
        visibility: 'public',
        createdBy: 'u1',
        createdAt: now,
        archivedAt: null,
      },
    ];
    db.channelMembers = [];
    db.notifications = [];
    db.mutes = [];
  });

  it('sends a mention notification unless the room is muted', () => {
    const body = 'hi @Hira Member';
    expect(notifyForMessage({ roomId: ROOM, messageId: 'm1', authorId: 'u1', body })).toHaveLength(1);

    setMuted('u2', ROOM, true);
    expect(isMuted('u2', ROOM)).toBe(true);
    expect(notifyForMessage({ roomId: ROOM, messageId: 'm2', authorId: 'u1', body })).toHaveLength(0);

    setMuted('u2', ROOM, false);
    expect(notifyForMessage({ roomId: ROOM, messageId: 'm3', authorId: 'u1', body })).toHaveLength(1);
  });
});
