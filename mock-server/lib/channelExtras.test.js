import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../data/store.js';
import { isArchivedRoom, markRoomReadAt, unreadCountFor, updateChannelDetails } from './channelExtras.js';

const ROOM = 'channel:c1';

describe('channel unread and archive', () => {
  beforeEach(() => {
    db.messages = [];
    db.reads = [];
    db.channels = [];
  });

  it('counts other people messages, not own, threaded, or deleted ones', () => {
    db.messages.push(
      {
        id: 'm1',
        roomId: ROOM,
        authorId: 'a',
        threadId: null,
        deletedAt: null,
        createdAt: '2026-01-01T10:00:00.000Z',
      },
      {
        id: 'm2',
        roomId: ROOM,
        authorId: 'me',
        threadId: null,
        deletedAt: null,
        createdAt: '2026-01-01T10:01:00.000Z',
      },
      {
        id: 'm3',
        roomId: ROOM,
        authorId: 'a',
        threadId: 'm1',
        deletedAt: null,
        createdAt: '2026-01-01T10:02:00.000Z',
      },
      {
        id: 'm4',
        roomId: ROOM,
        authorId: 'a',
        threadId: null,
        deletedAt: '2026-01-01T10:03:00.000Z',
        createdAt: '2026-01-01T10:03:00.000Z',
      },
    );
    expect(unreadCountFor(ROOM, 'me')).toBe(1);
  });

  it('resets to zero after the room is read', () => {
    db.messages.push({
      id: 'm1',
      roomId: ROOM,
      authorId: 'a',
      threadId: null,
      deletedAt: null,
      createdAt: '2020-01-01T00:00:00.000Z',
    });
    expect(unreadCountFor(ROOM, 'me')).toBe(1);
    markRoomReadAt(ROOM, 'me');
    expect(unreadCountFor(ROOM, 'me')).toBe(0);
  });

  it('knows when a channel is archived', () => {
    const channel = { id: 'c1', archivedAt: null };
    db.channels.push(channel);
    expect(isArchivedRoom(ROOM)).toBe(false);
    updateChannelDetails(channel, { archived: true });
    expect(isArchivedRoom(ROOM)).toBe(true);
    updateChannelDetails(channel, { archived: false });
    expect(isArchivedRoom(ROOM)).toBe(false);
  });
});
