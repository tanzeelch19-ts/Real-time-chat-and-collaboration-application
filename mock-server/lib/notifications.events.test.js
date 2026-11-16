import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../data/store.js';
import { createNotification, listNotifications } from './notificationService.js';

describe('invitation and channel notifications', () => {
  beforeEach(() => {
    const now = new Date().toISOString();
    db.users = [
      {
        id: 'a',
        displayName: 'Ayesha Owner',
        email: 'a@t.local',
        avatarUrl: '',
        statusMessage: '',
        passwordHash: 'x',
        createdAt: now,
      },
      {
        id: 'b',
        displayName: 'Hira Member',
        email: 'b@t.local',
        avatarUrl: '',
        statusMessage: '',
        passwordHash: 'x',
        createdAt: now,
      },
    ];
    db.notifications = [];
  });

  it('tells the inviter when someone joins through their link', () => {
    createNotification({
      userId: 'a',
      kind: 'invitation',
      workspaceId: 'w1',
      roomId: null,
      actorId: 'b',
      preview: 'Demo Workspace',
    });
    const { notifications, unreadCount } = listNotifications('a');
    expect(notifications[0].kind).toBe('invitation');
    expect(notifications[0].actor.displayName).toBe('Hira Member');
    expect(unreadCount).toBe(1);
  });

  it('tells a person they were added to a channel', () => {
    createNotification({
      userId: 'b',
      kind: 'channel',
      workspaceId: 'w1',
      roomId: 'channel:c1',
      actorId: 'a',
      preview: '#general',
    });
    expect(listNotifications('b').notifications[0].roomId).toBe('channel:c1');
  });

  it('does not notify someone about their own action', () => {
    expect(
      createNotification({
        userId: 'a',
        kind: 'channel',
        workspaceId: 'w1',
        roomId: 'channel:c1',
        actorId: 'a',
        preview: '#general',
      }),
    ).toBeNull();
    expect(db.notifications).toHaveLength(0);
  });
});
